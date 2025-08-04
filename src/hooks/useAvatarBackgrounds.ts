
// This hook provides avatar background management functionality
// Updated to match the expected interface used by AvatarManager

export interface AvatarBackground {
  id: string;
  name: string;
  type: 'color' | 'image';
  value: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useAvatarBackgrounds = () => {
  const defaultBackgrounds: AvatarBackground[] = [
    {
      id: '1',
      name: 'Blu',
      type: 'color',
      value: '#3b82f6',
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null
    },
    {
      id: '2',
      name: 'Verde',
      type: 'color',
      value: '#10b981',
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null
    },
    {
      id: '3',
      name: 'Rosso',
      type: 'color',
      value: '#ef4444',
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null
    }
  ];

  const defaultBackground = defaultBackgrounds.find(bg => bg.is_default) || defaultBackgrounds[0];

  return {
    backgrounds: defaultBackgrounds,
    defaultBackground,
    loading: false,
    error: null,
    createBackground: (data: Partial<AvatarBackground>) => {
      console.log('Creating background:', data);
      return Promise.resolve(null);
    },
    updateBackground: (id: string, data: Partial<AvatarBackground>) => {
      console.log('Updating background:', id, data);
      return Promise.resolve(null);
    },
    deleteBackground: (id: string) => {
      console.log('Deleting background:', id);
      return Promise.resolve(null);
    },
    setAsDefaultBackground: (id: string) => {
      console.log('Setting as default:', id);
      return Promise.resolve(null);
    },
    uploadImage: async (file: File) => {
      console.log('Uploading image:', file.name);
      // Mock implementation - in real app this would upload to storage
      const mockUrl = URL.createObjectURL(file);
      return Promise.resolve(mockUrl);
    }
  };
};
