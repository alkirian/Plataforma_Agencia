import { Router } from 'express';
import userRoutes from './users.routes.js';
import clientRoutes from './clients.routes.js';
import documentsRoutes from './documents.routes.js';
import aiRoutes from './ai.routes.js';
import scheduleRoutes from './schedule.routes.js';
import { protect } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { handleGetAgencyActivityFeed } from '../controllers/activity.controller.js';

const router = Router();

router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// DEBUG: escaneo rápido de tablas de perfil (sin auth, solo dev local)
router.get('/debug/profiles-scan', async (_req, res) => {
    try {
        const trySelect = async (table) => {
            const r = await supabaseAdmin.from(table).select('id, agency_id, email').limit(5);
            return { table, count: r.data?.length || 0, sample: r.data || null, error: r.error || null };
        };

        const results = [];
        for (const t of ['profiles', 'profile', 'public.profiles', 'public.profile']) {
            try {
                results.push(await trySelect(t));
            } catch (e) {
                results.push({ table: t, count: 0, sample: null, error: String(e?.message || e) });
            }
        }
        res.json({ ok: true, results });
    } catch (e) {
        res.status(500).json({ ok: false, message: 'scan error', error: String(e?.message || e) });
    }
});

// DEBUG: inspección de perfil en BD
router.get('/debug/profile', protect, async (req, res) => {
    try {
        const userId = req.user?.id;
        const q1 = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        const q2 = await supabaseAdmin
            .from('profile')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        res.json({
            userId,
            profiles: { data: q1.data, error: q1.error },
            profile: { data: q2.data, error: q2.error },
        });
    } catch (e) {
        res.status(500).json({ message: 'debug error', error: String(e?.message || e) });
    }
});

// Registra las rutas de los módulos
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/documents', documentsRoutes);
router.use('/ai', aiRoutes);
router.use('/schedule', scheduleRoutes);

// Feed global de actividad de la agencia
router.get('/activity-feed', protect, handleGetAgencyActivityFeed);

export default router;