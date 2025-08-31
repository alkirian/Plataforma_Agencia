import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getClients, createClient, updateClientMeta, upsertClientContacts } from '../../api/clients.js';
import { uploadDocument } from '../../api/documents.js';
import { createUrlSource, createManualSource } from '../../api/contextSources.js';

const industries = ['Tecnología', 'Retail', 'Servicios', 'Salud', 'Educación', 'Finanzas', 'Otro'];

const normalizeUrl = (val) => {
  if (!val) return '';
  let v = String(val).trim();
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  return v;
};

export const ClientCreationModal = ({ isOpen, onClose, onCreate, isSubmitting }) => {
  const queryClient = useQueryClient();
  const { data: clientsResp } = useQuery({ queryKey: ['clients'], queryFn: getClients, enabled: isOpen });
  const existingNames = useMemo(() => (clientsResp?.data || []).map(c => c.name?.toLowerCase().trim()).filter(Boolean), [clientsResp]);

  const { register, handleSubmit, watch, setValue, formState, reset } = useForm({
    defaultValues: { name: '', industry: '', website: '', socials: {}, contacts: [] }
  });
  const nameVal = watch('name');
  const [step, setStep] = useState(1); // 1=Basics, 2=Links & Contacts, 3=Knowledge
  const [createdClient, setCreatedClient] = useState(null);
  const [docFiles, setDocFiles] = useState([]);
  const [urlToAdd, setUrlToAdd] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setStep(1);
      setCreatedClient(null);
      setDocFiles([]);
      setUrlToAdd('');
      setManualNote('');
      setSubmitting(false);
    }
  }, [isOpen, reset]);

  const nameExists = useMemo(() => {
    const n = String(nameVal || '').toLowerCase().trim();
    if (!n) return false;
    return existingNames.includes(n);
  }, [existingNames, nameVal]);

  const canNextFromStep1 = () => {
    const n = String(watch('name') || '').trim();
    return n.length >= 2 && n.length <= 100 && !nameExists;
  };

  const handleCreateBasics = async (data) => {
    // Creates the client and move to step 2
    const payload = { name: data.name.trim(), industry: data.industry || null };
    const resp = await onCreate(payload);
    // onCreate returns a promise (Dashboard wraps via mutation). We want the client id from API response
    // If Dashboard didn't pass through, try to refetch clients and infer
    await queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  // We wrap onCreate to capture returned value using a local mutation (fallback)
  const createDirectMutation = useMutation({
    mutationFn: (payload) => toast.promise(
      createClient(payload),
      { loading: 'Creando cliente…', success: 'Cliente creado', error: (e) => e.message || 'No se pudo crear el cliente' }
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
  });

  const submitStep1 = async (data) => {
    if (!canNextFromStep1()) return;
    setSubmitting(true);
    try {
      // Create directly here to guarantee we have the new client ID
      const response = await createDirectMutation.mutateAsync({ name: data.name.trim(), industry: data.industry || null });
      const created = response?.data || null;
      if (created?.id) {
        setCreatedClient(created);
      } else {
        // Fallback: refetch and find by name
        const refetched = await queryClient.fetchQuery({ queryKey: ['clients'], queryFn: getClients });
        const found = (refetched?.data || []).find(c => c.name?.toLowerCase().trim() === data.name.trim().toLowerCase());
        if (found) setCreatedClient(found);
      }
      setStep(2);
    } catch (e) {
      // toast already shown by mutation
    } finally {
      setSubmitting(false);
    }
  };

  const submitFinalize = async () => {
    if (!createdClient?.id) return;
    setSubmitting(true);
    try {
      const clientId = createdClient.id;
      // Update website/socials
      const website = normalizeUrl(watch('website')) || null;
      const socials = watch('socials') || {};
      const normalizedSocials = Object.fromEntries(Object.entries(socials || {}).map(([k, v]) => [k, normalizeUrl(v)]));
      await updateClientMeta(clientId, { website, social_links: normalizedSocials });

      // Contacts
      const contacts = (watch('contacts') || []).filter(c => (c.name || c.email || c.phone));
      if (contacts.length) await upsertClientContacts(clientId, contacts);

      // Documents
      for (const file of docFiles) {
        try { await uploadDocument(createdClient.id, file); } catch {}
      }

      // Context sources: URL
      if (urlToAdd && urlToAdd.trim().length > 0) {
        await createUrlSource(clientId, { url: normalizeUrl(urlToAdd) });
      }
      // Manual note
      if (manualNote && manualNote.trim().length > 0) {
        await createManualSource(clientId, { content: manualNote, title: 'Nota inicial' });
      }

      // Navigate to the new client and close
      try { window.history.pushState({}, '', `/clients/${createdClient.id}`); } catch {}
      window.location.href = `/clients/${createdClient.id}`;
      onClose();
    } catch (e) {
      // Could show toast, parent likely already handles
    } finally {
      setSubmitting(false);
    }
  };

  const StepIndicator = () => (
    <div className='flex items-center justify-center gap-2 mb-4'>
      {[1,2,3].map(s => (
        <div key={s} className={`h-2 w-12 rounded-full ${step>=s ? 'bg-primary-500' : 'bg-surface-soft border border-border-subtle'}`} />
      ))}
    </div>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child as={Fragment} enter='ease-out duration-200' enterFrom='opacity-0' enterTo='opacity-100' leave='ease-in duration-150' leaveFrom='opacity-100' leaveTo='opacity-0'>
          <div className='fixed inset-0 bg-black/50' />
        </Transition.Child>
        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child as={Fragment} enter='ease-out duration-200' enterFrom='opacity-0 scale-95' enterTo='opacity-100 scale-100' leave='ease-in duration-150' leaveFrom='opacity-100 scale-100' leaveTo='opacity-0 scale-95'>
              <Dialog.Panel className='w-full max-w-2xl rounded-xl border border-white/10 bg-surface-strong p-6 shadow-lg'>
                <Dialog.Title className='mb-2 text-lg font-semibold text-white'>Nuevo cliente</Dialog.Title>
                <StepIndicator />

                {step === 1 && (
                  <form onSubmit={handleSubmit(submitStep1)} className='space-y-4'>
                    <div>
                      <label className='mb-1 block text-sm text-text-muted'>Nombre (único por agencia)</label>
                      <input
                        type='text'
                        className={`w-full rounded-md border px-3 py-2 bg-rambla-bg text-white placeholder-rambla-text-secondary focus:outline-none ${nameExists ? 'border-red-500' : 'border-rambla-border focus:border-rambla-accent'}`}
                        placeholder='Ej. Acme Corp'
                        {...register('name', { required: true, minLength: 2, maxLength: 100 })}
                        required
                      />
                      {nameExists && <p className='text-xs text-red-400 mt-1'>Ya existe un cliente con ese nombre.</p>}
                    </div>
                    <div>
                      <label className='mb-1 block text-sm text-text-muted'>Industria (opcional)</label>
                      <input
                        list='industry-list'
                        type='text'
                        className='w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none'
                        placeholder='Selecciona o escribe'
                        {...register('industry')}
                      />
                      <datalist id='industry-list'>
                        {industries.map(i => <option key={i} value={i} />)}
                      </datalist>
                    </div>
                    <div className='flex justify-end gap-2 pt-2'>
                      <button type='button' onClick={onClose} className='rounded-md border border-rambla-border px-4 py-2 text-sm text-rambla-text-secondary hover:border-rambla-accent'>Cancelar</button>
                      <button type='submit' disabled={!canNextFromStep1() || submitting} className='rounded-md bg-rambla-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90'>
                        {submitting ? 'Creando…' : 'Continuar'}
                      </button>
                    </div>
                  </form>
                )}

                {step === 2 && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='font-semibold text-text-primary mb-2'>Sitio web y redes (opcional)</h3>
                      <div className='space-y-3'>
                        <div>
                          <label className='mb-1 block text-sm text-text-muted'>Sitio web</label>
                          <input type='url' className='w-full rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary' placeholder='https://www.miweb.com' {...register('website')} />
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                          {['linkedin','instagram','facebook','x','youtube','tiktok','whatsapp'].map(key => (
                            <div key={key}>
                              <label className='mb-1 block text-xs capitalize text-text-muted'>{key}</label>
                              <input type='url' className='w-full rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary' placeholder={`URL de ${key}`} onChange={(e)=>setValue(`socials.${key}`, e.target.value)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className='font-semibold text-text-primary mb-2'>Contactos del cliente (opcional)</h3>
                      <ContactsEditor value={watch('contacts')||[]} onChange={(val)=>setValue('contacts', val)} />
                    </div>

                    <div className='flex justify-between pt-2'>
                      <button type='button' onClick={()=>setStep(1)} className='rounded-md border border-rambla-border px-4 py-2 text-sm text-rambla-text-secondary hover:border-rambla-accent'>Atrás</button>
                      <button type='button' onClick={()=>setStep(3)} className='rounded-md bg-rambla-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90'>Siguiente</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='font-semibold text-text-primary mb-2'>Conocimiento inicial (opcional)</h3>
                      <div className='space-y-4'>
                        <div>
                          <label className='mb-1 block text-sm text-text-muted'>Subir documentos</label>
                          <input type='file' multiple onChange={(e)=>setDocFiles(Array.from(e.target.files||[]))} className='block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700' />
                          {docFiles.length>0 && <p className='text-xs text-text-muted mt-1'>{docFiles.length} archivo(s) seleccionados</p>}
                        </div>
                        <div>
                          <label className='mb-1 block text-sm text-text-muted'>Agregar URL</label>
                          <input value={urlToAdd} onChange={(e)=>setUrlToAdd(e.target.value)} className='w-full rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary' placeholder='https://ejemplo.com/articulo' />
                        </div>
                        <div>
                          <label className='mb-1 block text-sm text-text-muted'>Nota/Manual</label>
                          <textarea value={manualNote} onChange={(e)=>setManualNote(e.target.value)} rows={4} className='w-full rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary' placeholder='Pega informaciFn contextual, descripción de marca, etc.' />
                        </div>
                      </div>
                    </div>
                    <div className='flex justify-between'>
                      <button type='button' onClick={()=>setStep(2)} className='rounded-md border border-rambla-border px-4 py-2 text-sm text-rambla-text-secondary hover:border-rambla-accent'>Atrás</button>
                      <button type='button' disabled={submitting || !createdClient?.id} onClick={submitFinalize} className='rounded-md bg-rambla-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90'>
                        {submitting ? 'Guardando…' : 'Crear y abrir'}
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const ContactsEditor = ({ value, onChange }) => {
  const items = value || [];
  const add = () => onChange?.([...items, { name:'', email:'', phone:'', role:'' }]);
  const remove = (idx) => onChange?.(items.filter((_,i)=>i!==idx));
  const update = (idx, key, val) => {
    const next = items.slice();
    next[idx] = { ...next[idx], [key]: val };
    onChange?.(next);
  };
  return (
    <div className='space-y-3'>
      {items.map((c, idx)=>(
        <div key={idx} className='grid grid-cols-1 sm:grid-cols-4 gap-2'>
          <input value={c.name||''} onChange={e=>update(idx,'name',e.target.value)} placeholder='Nombre' className='rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary'/>
          <input value={c.email||''} onChange={e=>update(idx,'email',e.target.value)} placeholder='Email' className='rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary'/>
          <input value={c.phone||''} onChange={e=>update(idx,'phone',e.target.value)} placeholder='Teléfono' className='rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary'/>
          <div className='flex gap-2'>
            <input value={c.role||''} onChange={e=>update(idx,'role',e.target.value)} placeholder='Rol' className='flex-1 rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary'/>
            <button type='button' onClick={()=>remove(idx)} className='rounded-md border border-border-subtle px-3 py-2 text-sm text-text-muted hover:border-red-500 hover:text-red-400'>Eliminar</button>
          </div>
        </div>
      ))}
      <button type='button' onClick={add} className='rounded-md border border-border-subtle px-3 py-2 text-sm text-text-primary hover:border-rambla-accent'>+ Añadir contacto</button>
    </div>
  );
};
