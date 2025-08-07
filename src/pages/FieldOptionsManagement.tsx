import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useFieldOptions, FieldOption } from '@/hooks/useFieldOptions';
import { toast } from 'sonner';

const FieldOptionsManagement = () => {
  const { options, loading, loadOptions, createOption, updateOption, deleteOption } = useFieldOptions();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<FieldOption | null>(null);
  const [activeTab, setActiveTab] = useState('player_role');

  // Form states
  const [formData, setFormData] = useState({
    field_name: 'player_role',
    option_value: '',
    option_label: '',
    sort_order: 0
  });

  const fieldConfigs = {
    player_role: {
      label: 'Ruoli Giocatori',
      description: 'Gestisci i ruoli disponibili per i giocatori',
      icon: '⚽'
    },
    position: {
      label: 'Posizioni',
      description: 'Gestisci le posizioni disponibili',
      icon: '📍'
    },
    status: {
      label: 'Stati',
      description: 'Gestisci gli stati disponibili',
      icon: '📊'
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const handleCreateOption = async () => {
    if (!formData.option_value.trim() || !formData.option_label.trim()) {
      toast.error('Valore e etichetta sono obbligatori');
      return;
    }

    try {
      await createOption({
        field_name: formData.field_name,
        option_value: formData.option_value.trim().toLowerCase(),
        option_label: formData.option_label.trim(),
        sort_order: formData.sort_order,
        is_active: true
      });

      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating option:', error);
    }
  };

  const handleUpdateOption = async (option: FieldOption) => {
    if (!editingOption) return;

    try {
      await updateOption(option.id, {
        option_value: editingOption.option_value,
        option_label: editingOption.option_label,
        sort_order: editingOption.sort_order
      });

      setEditingOption(null);
    } catch (error) {
      console.error('Error updating option:', error);
    }
  };

  const handleDeleteOption = async (option: FieldOption) => {
    try {
      await deleteOption(option.id);
    } catch (error) {
      console.error('Error deleting option:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      field_name: activeTab,
      option_value: '',
      option_label: '',
      sort_order: 0
    });
  };

  const getOptionsForTab = (tabName: string) => {
    return options.filter(option => option.field_name === tabName);
  };

  const getNextSortOrder = (fieldName: string) => {
    const fieldOptions = getOptionsForTab(fieldName);
    return fieldOptions.length > 0 ? Math.max(...fieldOptions.map(o => o.sort_order)) + 1 : 1;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Gestione Opzioni Campi
          </CardTitle>
          <CardDescription>
            Configura le opzioni disponibili per i campi select dell'applicazione
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(fieldConfigs).map(([key, config]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              <span>{config.icon}</span>
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(fieldConfigs).map(([tabName, config]) => (
          <TabsContent key={tabName} value={tabName}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {config.icon} {config.label}
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </div>
                  <Dialog open={isCreateModalOpen && formData.field_name === tabName} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => {
                          setFormData(prev => ({ ...prev, field_name: tabName, sort_order: getNextSortOrder(tabName) }));
                          setIsCreateModalOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi {config.label.slice(0, -1)}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Aggiungi {config.label.slice(0, -1)}</DialogTitle>
                        <DialogDescription>
                          Inserisci i dettagli per la nuova opzione
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="option_value">Valore</Label>
                          <Input
                            id="option_value"
                            value={formData.option_value}
                            onChange={(e) => setFormData(prev => ({ ...prev, option_value: e.target.value }))}
                            placeholder="es. attaccante"
                          />
                        </div>
                        <div>
                          <Label htmlFor="option_label">Etichetta</Label>
                          <Input
                            id="option_label"
                            value={formData.option_label}
                            onChange={(e) => setFormData(prev => ({ ...prev, option_label: e.target.value }))}
                            placeholder="es. Attaccante"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sort_order">Ordine</Label>
                          <Input
                            id="sort_order"
                            type="number"
                            value={formData.sort_order}
                            onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                          Annulla
                        </Button>
                        <Button onClick={handleCreateOption}>
                          <Save className="h-4 w-4 mr-2" />
                          Salva
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getOptionsForTab(tabName).map((option) => (
                    <div key={option.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">#{option.sort_order}</Badge>
                        <div>
                          <div className="font-medium">{option.option_label}</div>
                          <div className="text-sm text-muted-foreground">{option.option_value}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingOption?.id === option.id ? (
                          <>
                            <Input
                              value={editingOption.option_label}
                              onChange={(e) => setEditingOption(prev => prev ? { ...prev, option_label: e.target.value } : null)}
                              className="w-32"
                            />
                            <Button size="sm" onClick={() => handleUpdateOption(option)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingOption(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setEditingOption(option)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Elimina opzione</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare l'opzione "{option.option_label}"? 
                                    Questa azione non può essere annullata.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteOption(option)}>
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {getOptionsForTab(tabName).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nessuna opzione configurata per {config.label.toLowerCase()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FieldOptionsManagement; 