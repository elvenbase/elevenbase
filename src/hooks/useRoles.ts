import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface RoleRec {
	code: string
	label: string
	abbreviation: string
	sort_order: number
	is_active: boolean
}

export const useRoles = () => {
	return useQuery({
		queryKey: ['roles'],
		queryFn: async (): Promise<RoleRec[]> => {
			const { data, error } = await supabase
				.from('roles')
				.select('code,label,abbreviation,sort_order,is_active')
				.eq('is_active', true)
				.order('sort_order', { ascending: true })
			if (error) throw error
			return data as RoleRec[]
		}
	})
}