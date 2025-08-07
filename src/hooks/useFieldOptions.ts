import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FieldOption {
  id: string;
  field_name: string;
  option_value: string;
  option_label: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Cache globale per evitare chiamate multiple
let globalOptionsCache: FieldOption[] = [];
let globalLoadingPromise: Promise<FieldOption[]> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

export const useFieldOptions = () => {
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadOptions = async (fieldName?: string) => {
    try {
      // Se abbiamo già una promise in corso, aspettiamo quella
      if (globalLoadingPromise) {
        const cachedData = await globalLoadingPromise;
        if (mountedRef.current) {
          setOptions(cachedData);
          setLoading(false);
        }
        return;
      }

      // Controlla se il cache è ancora valido
      const now = Date.now();
      if (globalOptionsCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
        if (mountedRef.current) {
          setOptions(globalOptionsCache);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      
      // Crea una nuova promise per evitare chiamate multiple
      globalLoadingPromise = (async () => {
        const { data, error } = await supabase
          .from('field_options')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        const result = data || [];
        globalOptionsCache = result;
        lastFetchTime = now;
        return result;
      })();

      const result = await globalLoadingPromise;
      globalLoadingPromise = null;

      if (mountedRef.current) {
        setOptions(result);
        setLoading(false);
      }
    } catch (error) {
      globalLoadingPromise = null;
      console.error('Error loading field options:', error);
      // Non mostrare toast per ogni errore, solo log
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const invalidateCache = () => {
    globalOptionsCache = [];
    globalLoadingPromise = null;
    lastFetchTime = 0;
  };

  const createOption = async (option: Omit<FieldOption, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('field_options')
        .insert({
          ...option,
          created_by: user.user.id
        });

      if (error) throw error;

      // Invalida il cache e ricarica
      invalidateCache();
      await loadOptions();
      toast.success('Opzione creata con successo');
    } catch (error) {
      console.error('Error creating option:', error);
      toast.error('Errore nella creazione dell\'opzione');
    }
  };

  const updateOption = async (id: string, updates: Partial<Pick<FieldOption, 'option_value' | 'option_label' | 'sort_order' | 'is_active'>>) => {
    try {
      const { error } = await supabase
        .from('field_options')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Invalida il cache e ricarica
      invalidateCache();
      await loadOptions();
      toast.success('Opzione aggiornata con successo');
    } catch (error) {
      console.error('Error updating option:', error);
      toast.error('Errore nell\'aggiornamento dell\'opzione');
    }
  };

  const deleteOption = async (id: string) => {
    try {
      const { error } = await supabase
        .from('field_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Invalida il cache e ricarica
      invalidateCache();
      await loadOptions();
      toast.success('Opzione eliminata con successo');
    } catch (error) {
      console.error('Error deleting option:', error);
      toast.error('Errore nell\'eliminazione dell\'opzione');
    }
  };

  const getOptionsForField = (fieldName: string): FieldOption[] => {
    return options.filter(option => option.field_name === fieldName);
  };

  const getOptionLabel = (fieldName: string, value: string): string => {
    const option = options.find(opt => opt.field_name === fieldName && opt.option_value === value);
    return option?.option_label || value;
  };

  return {
    options,
    loading,
    loadOptions,
    createOption,
    updateOption,
    deleteOption,
    getOptionsForField,
    getOptionLabel,
    invalidateCache
  };
}; 