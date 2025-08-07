import { useState, useEffect } from 'react';
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

export const useFieldOptions = () => {
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOptions = async (fieldName?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('field_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fieldName) {
        query = query.eq('field_name', fieldName);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOptions(data || []);
    } catch (error) {
      console.error('Error loading field options:', error);
      toast.error('Impossibile caricare le opzioni');
    } finally {
      setLoading(false);
    }
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

      await loadOptions(option.field_name);
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
    getOptionLabel
  };
}; 