
// This hook has been removed due to security concerns with the app_settings table
// App settings should be managed through environment variables or secure admin interfaces

export const useAppSettings = () => {
  return {
    data: null,
    isLoading: false,
    error: null,
    updateSetting: () => Promise.resolve(false)
  };
};
