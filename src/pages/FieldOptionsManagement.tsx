import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Edit, Trash2, Save, X, UserCog } from 'lucide-react';
import { useFieldOptions, FieldOption } from '@/hooks/useFieldOptions';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FieldOptionsManagement = () => {
  const { options, loading, loadOptions, createOption, updateOption, deleteOption } = useFieldOptions();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<FieldOption | null>(null);
  const [activeTab, setActiveTab] = useState('roles');
  const queryClient = useQueryClient();

  // Form states
  const [formData, setFormData] = useState({
    field_name: 'player_role',
    option_value: '',
    option_label: '',
    abbreviation: '',
    sort_order: 0
  });

  // Roles management state (source of truth)
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const [rolesCreateOpen, setRolesCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ code: '', label: '', abbreviation: '', sort_order: 0, is_active: true });
  const [editingRoleCode, setEditingRoleCode] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<{ code: string; label: string; abbreviation: string; sort_order: number; is_active: boolean } | null>(null);

  const fieldConfigs = {
    roles: {
      label: 'Ruoli (fonte di verità)',
      description: 'Gestisci i ruoli (label e sigla). Tutto il sistema legge da qui.',
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

  const createRole = async () => {
    if (!newRole.code.trim() || !newRole.label.trim()) {
      toast.error('Codice e nome ruolo sono obbligatori');
      return;
    }
    try {
      const payload = {
        code: newRole.code.trim().toUpperCase(),
        label: newRole.label.trim(),
        abbreviation: (newRole.abbreviation || '').trim().toUpperCase(),
        sort_order: Number(newRole.sort_order) || 0,
        is_active: !!newRole.is_active
      };
      const { error } = await supabase.from('roles').insert(payload);
      if (error) throw error;
      setRolesCreateOpen(false);
      setNewRole({ code: '', label: '', abbreviation: '', sort_order: 0, is_active: true });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Ruolo creato');
    } catch (e: any) {
      toast.error(e?.message || 'Errore creazione ruolo');
    }
  };

  const saveRole = async () => {
    if (!editingRole) return;
    try {
      const { code, label, abbreviation, sort_order, is_active } = editingRole;
      const { error } = await supabase
        .from('roles')
        .update({ label, abbreviation, sort_order, is_active })
        .eq('code', code);
      if (error) throw error;
      setEditingRole(null);
      setEditingRoleCode(null);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Ruolo aggiornato');
    } catch (e: any) {
      toast.error(e?.message || 'Errore aggiornamento ruolo');
    }
  };

  const deleteRole = async (code: string) => {
    try {
      const { error } = await supabase.from('roles').delete().eq('code', code);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Ruolo eliminato');
    } catch (e: any) {
      // Potrebbe essere bloccato dal trigger se in uso
      toast.error(e?.message || 'Impossibile eliminare: ruolo in uso');
    }
  };

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
        abbreviation: formData.abbreviation.trim().toUpperCase(),
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
        abbreviation: editingOption.abbreviation,
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
      abbreviation: '',
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

  if (loading || (activeTab === 'roles' && rolesLoading)) {
    return (
      <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-0">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-0">
      <Card className="mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <UserCog className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Gestione Opzioni Giocatori
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Configura le opzioni disponibili per i campi select dell'applicazione
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
          {Object.entries(fieldConfigs).map(([key, config]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-1 sm:gap-2">
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
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      {config.icon} {config.label}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">{config.description}</CardDescription>
                  </div>
                  {tabName === 'roles' ? (
                    <Dialog open={rolesCreateOpen} onOpenChange={setRolesCreateOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setRolesCreateOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" /> Aggiungi Ruolo
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Aggiungi Ruolo</DialogTitle>
                          <DialogDescription>Codice (es. MC), nome esteso e sigla</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Codice</Label>
                            <Input value={newRole.code} onChange={e=>setNewRole(prev=>({ ...prev, code: e.target.value.toUpperCase() }))} placeholder="es. MC" />
                          </div>
                          <div>
                            <Label>Etichetta</Label>
                            <Input value={newRole.label} onChange={e=>setNewRole(prev=>({ ...prev, label: e.target.value }))} placeholder="es. Centrocampista" />
                          </div>
                          <div>
                            <Label>Sigla</Label>
                            <Input value={newRole.abbreviation} onChange={e=>setNewRole(prev=>({ ...prev, abbreviation: e.target.value.toUpperCase() }))} placeholder="es. MC" maxLength={3} />
                          </div>
                          <div>
                            <Label>Ordine</Label>
                            <Input type="number" value={newRole.sort_order} onChange={e=>setNewRole(prev=>({ ...prev, sort_order: parseInt(e.target.value)||0 }))} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={()=>setRolesCreateOpen(false)}>Annulla</Button>
                          <Button onClick={createRole}><Save className="h-4 w-4 mr-2" /> Salva</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Dialog open={isCreateModalOpen && formData.field_name === tabName} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => {
                          setFormData(prev => ({ ...prev, field_name: tabName, sort_order: getNextSortOrder(tabName) }));
                          setIsCreateModalOpen(true);
                        }}
                        size="sm"
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
                          <Label htmlFor="abbreviation">Sigla (2 lettere)</Label>
                          <Input
                            id="abbreviation"
                            value={formData.abbreviation}
                            onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value.toUpperCase() }))}
                            placeholder="es. AT"
                            maxLength={2}
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
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {tabName === 'roles' ? (
                  <div className="space-y-3 sm:space-y-4">
                    {roles.map((r) => (
                      <div key={r.code} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">#{r.sort_order}</Badge>
                          <div>
                            <div className="font-medium text-sm sm:text-base">{r.label} <span className="ml-2 text-[10px] sm:text-xs bg-primary/10 text-primary px-1 rounded">{r.abbreviation}</span></div>
                            <div className="text-xs sm:text-sm text-muted-foreground">{r.code}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {editingRoleCode === r.code && editingRole ? (
                            <>
                              <Input value={editingRole.label} onChange={e=>setEditingRole(prev=>prev?{...prev,label:e.target.value}:prev)} className="w-28 sm:w-40" />
                              <Input value={editingRole.abbreviation} onChange={e=>setEditingRole(prev=>prev?{...prev,abbreviation:e.target.value.toUpperCase()}:prev)} className="w-14" maxLength={3} />
                              <Input type="number" value={editingRole.sort_order} onChange={e=>setEditingRole(prev=>prev?{...prev,sort_order:parseInt(e.target.value)||0}:prev)} className="w-16" />
                              <Button size="sm" onClick={saveRole}><Save className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" onClick={()=>{setEditingRole(null); setEditingRoleCode(null)}}><X className="h-4 w-4" /></Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={()=>{setEditingRoleCode(r.code); setEditingRole({ code: r.code, label: r.label, abbreviation: r.abbreviation, sort_order: r.sort_order, is_active: r.is_active })}}>
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
                                    <AlertDialogTitle>Elimina ruolo</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Eliminare "{r.label}" ({r.code})? L'operazione può fallire se il ruolo è in uso.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction onClick={()=>deleteRole(r.code)}>Elimina</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {roles.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">Nessun ruolo definito</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {getOptionsForTab(tabName).map((option) => (
                      <div key={option.id} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">#{option.sort_order}</Badge>
                          <div>
                            <div className="font-medium text-sm sm:text-base">{option.option_label}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              {option.option_value}
                              {option.abbreviation && (
                                <span className="ml-2 text-[10px] sm:text-xs bg-primary/10 text-primary px-1 rounded">
                                  {option.abbreviation}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {editingOption?.id === option.id ? (
                            <>
                              <Input
                                value={editingOption.option_label}
                                onChange={(e) => setEditingOption(prev => prev ? { ...prev, option_label: e.target.value } : null)}
                                className="w-24 sm:w-32"
                                placeholder="Etichetta"
                              />
                              <Input
                                value={editingOption.abbreviation || ''}
                                onChange={(e) => setEditingOption(prev => prev ? { ...prev, abbreviation: e.target.value.toUpperCase() } : null)}
                                className="w-12 sm:w-16"
                                placeholder="Sigla"
                                maxLength={2}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FieldOptionsManagement; 