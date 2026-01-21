// Infrastructure Adapter: Supabase Implementation
// Implements DocumentRepository interface

import { DocumentRepository } from "../../domain/documents/DocumentRepository.js";
import { DocumentEntity } from "../../domain/documents/DocumentEntity.js";
import { logger } from "../../utils/logger.js";

export class SupabaseDocumentRepository extends DocumentRepository {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async findByCriteria(criteria) {
    let query = this.supabase.from("documents").select("*");

    // Base filters
    if (criteria.clientId) {
      query = query.eq("client_id", criteria.clientId);
    }
    if (criteria.agencyId) {
      query = query.eq("agency_id", criteria.agencyId);
    }

    // Soft delete filter
    if (!criteria.deleted) {
      query = query.is("deleted_at", null);
    }

    // Search
    if (criteria.search) {
      query = query.ilike("filename_sanitized", `%${criteria.search}%`);
    }

    // Type filter
    if (criteria.type) {
      const mimePatterns = this.getMimePatterns(criteria.type);
      if (mimePatterns.length > 0) {
        query = query.or(
          mimePatterns.map((pattern) => `mime_type.like.${pattern}`).join(","),
        );
      }
    }

    // Pinned filter
    if (criteria.pinned === true) {
      query = query.not("pinned_at", "is", null);
    } else if (criteria.pinned === false) {
      query = query.is("pinned_at", null);
    }

    // Version group filter
    if (criteria.versionGroup) {
      query = query.eq("version_group", criteria.versionGroup);
    }

    // Duplicate filter
    if (criteria.duplicateOf) {
      query = query.eq("duplicate_of", criteria.duplicateOf);
    }

    // Ordering: pinned first, then by creation date
    query = query.order("pinned_at", { ascending: false, nullsLast: true });
    query = query.order("created_at", { ascending: false });

    // Pagination
    const limit = Math.min(criteria.limit || 50, 100);
    if (criteria.cursor) {
      // Cursor-based pagination
      const [createdAt, id] = criteria.cursor.split("|");
      query = query.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
      );
    }
    query = query.limit(limit + 1); // +1 to check if there's more

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const hasMore = data.length > limit;
    const documents = (hasMore ? data.slice(0, -1) : data).map(
      (row) => new DocumentEntity(row),
    );

    let nextCursor = null;
    if (hasMore) {
      const lastDoc = documents[documents.length - 1];
      nextCursor = `${lastDoc.createdAt}|${lastDoc.id}`;
    }

    // Get total count (approximate)
    let total = 0;
    if (!criteria.cursor) {
      const countQuery = this.supabase
        .from("documents")
        .select("*", { count: "estimated", head: true })
        .eq("client_id", criteria.clientId);

      if (!criteria.deleted) {
        countQuery.is("deleted_at", null);
      }

      const { count } = await countQuery;
      total = count || 0;
    }

    return {
      documents,
      nextCursor,
      total,
    };
  }

  async findById(id, agencyId) {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("agency_id", agencyId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Database query failed: ${error.message}`);
    }

    return new DocumentEntity(data);
  }

  async findByVersionGroup(versionGroup, clientId, agencyId) {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("version_group", versionGroup)
      .eq("client_id", clientId)
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return data.map((row) => new DocumentEntity(row));
  }

  async findByChecksum(checksum, clientId, agencyId) {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("checksum", checksum)
      .eq("client_id", clientId)
      .eq("agency_id", agencyId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Database query failed: ${error.message}`);
    }

    return new DocumentEntity(data);
  }

  async countPinned(clientId, agencyId) {
    const { count, error } = await this.supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("agency_id", agencyId)
      .not("pinned_at", "is", null)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return count || 0;
  }

  async save(document) {
    const data = this.entityToRow(document);

    if (document.id) {
      // Update
      const { data: result, error } = await this.supabase
        .from("documents")
        .update(data)
        .eq("id", document.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update document: ${error.message}`);
      }

      return new DocumentEntity(result);
    } else {
      // Insert
      const { data: result, error } = await this.supabase
        .from("documents")
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create document: ${error.message}`);
      }

      return new DocumentEntity(result);
    }
  }

  async delete(id, agencyId) {
    const { error } = await this.supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("agency_id", agencyId);

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  async getStorageStats(agencyId) {
    // Log for debugging
    logger.debug("getStorageStats called", { agencyId });

    // Validate input
    if (!agencyId) {
      throw new Error("Agency ID is required");
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agencyId)) {
      throw new Error("Invalid agency ID format");
    }

    // Get basic counts and sizes using direct Supabase queries
    const { data: documents, error: documentsError } = await this.supabase
      .from("documents")
      .select("size_bytes, deleted_at, pinned_at, mime_type, client_id")
      .eq("agency_id", agencyId);

    if (documentsError) {
      logger.error("Database error in getStorageStats", documentsError, {
        agencyId,
      });
      throw new Error(`Failed to get storage stats: ${documentsError.message}`);
    }

    // Calculate stats in JavaScript
    const stats = {
      totalSize: 0,
      totalCount: documents.length,
      activeCount: 0,
      deletedCount: 0,
      pinnedCount: 0,
      byType: {},
      byClient: {},
    };

    documents.forEach((doc) => {
      // Total size
      stats.totalSize += doc.size_bytes || 0;

      // Count stats
      if (doc.deleted_at) {
        stats.deletedCount++;
      } else {
        stats.activeCount++;
        if (doc.pinned_at) {
          stats.pinnedCount++;
        }
      }

      // File type classification
      let fileType = "other";
      if (doc.mime_type) {
        if (doc.mime_type.startsWith("image/")) fileType = "image";
        else if (doc.mime_type.startsWith("video/")) fileType = "video";
        else if (
          doc.mime_type === "application/pdf" ||
          doc.mime_type === "application/msword" ||
          doc.mime_type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          fileType = "pdf";
        } else if (doc.mime_type.startsWith("text/")) fileType = "text";
      }

      // Update type stats
      if (!stats.byType[fileType]) {
        stats.byType[fileType] = { size: 0, count: 0, activeCount: 0 };
      }
      stats.byType[fileType].size += doc.size_bytes || 0;
      stats.byType[fileType].count++;
      if (!doc.deleted_at) {
        stats.byType[fileType].activeCount++;
      }

      // Update client stats
      const clientId = doc.client_id;
      if (clientId) {
        if (!stats.byClient[clientId]) {
          stats.byClient[clientId] = { size: 0, count: 0, activeCount: 0 };
        }
        stats.byClient[clientId].size += doc.size_bytes || 0;
        stats.byClient[clientId].count++;
        if (!doc.deleted_at) {
          stats.byClient[clientId].activeCount++;
        }
      }
    });

    logger.info("Storage stats calculated", { agencyId, stats });
    return stats;
  }

  // Helper methods
  entityToRow(entity) {
    return {
      id: entity.id,
      agency_id: entity.agencyId,
      client_id: entity.clientId,
      // Usar file_name en lugar de filename_original (nombre real de la columna)
      file_name: entity.filenameOriginal || entity.filenameSanitized,
      // filename_sanitized puede no existir, omitirlo
      // filename_sanitized: entity.filenameSanitized,
      // extension puede no existir, omitirlo
      // extension: entity.extension,
      file_type: entity.mimeType,
      file_size: entity.sizeBytes,
      storage_path: entity.storagePath,
      // checksum puede no existir
      // checksum: entity.checksum,
      // duplicate_of puede no existir  
      // duplicate_of: entity.duplicateOf,
      // version_group puede no existir
      // version_group: entity.versionGroup,
      user_id: entity.uploadedBy,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      // deleted_at puede no existir
      // deleted_at: entity.deletedAt,
      // deleted_by puede no existir
      // deleted_by: entity.deletedBy,
      // pinned_at puede no existir
      // pinned_at: entity.pinnedAt,
      // pinned_by puede no existir
      // pinned_by: entity.pinnedBy,
    };
  }

  getMimePatterns(type) {
    const patterns = {
      image: ["image/%"],
      video: ["video/%"],
      document: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      text: ["text/%"],
      compressed: [
        "application/zip",
        "application/x-rar-compressed",
        "application/x-tar",
        "application/gzip",
      ],
      design: [
        "application/x-photoshop",
        "image/vnd.adobe.photoshop",
        "application/postscript",
      ],
    };
    return patterns[type] || [];
  }
}
