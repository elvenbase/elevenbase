
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Search, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { useTrialists, useDeleteTrialist } from '@/hooks/useSupabaseData';
import EditTrialistForm from '@/components/forms/EditTrialistForm';
import { TrialistDeleteDialog } from '@/components/TrialistDeleteDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';

type SortField = 'first_name' | 'last_name' | 'position' | 'status' | 'trial_start_date';
type SortDirection = 'asc' | 'desc';

const TrialistsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('first_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trialistToDelete, setTrialistToDelete] = useState<any>(null);

  const { data: trialists = [], isLoading } = useTrialists();
  const deleteTrialist = useDeleteTrialist();

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const filteredAndSortedTrialists = useMemo(() => {
    let filtered = trialists.filter(trialist => {
      const matchesSearch = searchTerm === '' || 
        `${trialist.first_name} ${trialist.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || trialist.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'trial_start_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [trialists, searchTerm, statusFilter, sortField, sortDirection]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'in_prova': { label: 'In Prova', variant: 'secondary' as const },
      'promosso': { label: 'Promosso', variant: 'default' as const },
      'archiviato': { label: 'Archiviato', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
      { label: status, variant: 'outline' as const };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const handleDeleteTrialist = (trialist: any) => {
    setTrialistToDelete(trialist);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (trialistToDelete) {
      await deleteTrialist.mutateAsync(trialistToDelete.id);
      setDeleteDialogOpen(false);
      setTrialistToDelete(null);
    }
  };

  if (isLoading) {
    return <div>Caricamento trialists...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filtri e Ricerca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca trialist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="in_prova">In Prova</SelectItem>
            <SelectItem value="promosso">Promosso</SelectItem>
            <SelectItem value="archiviato">Archiviato</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('first_name')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Nome {getSortIcon('first_name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('position')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Posizione {getSortIcon('position')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('status')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Stato {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('trial_start_date')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Data Inizio {getSortIcon('trial_start_date')}
                  </Button>
                </TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTrialists.map((trialist) => (
                <TableRow key={trialist.id}>
                  <TableCell>
                    <PlayerAvatar
                      firstName={trialist.first_name}
                      lastName={trialist.last_name}
                      avatarUrl={trialist.avatar_url}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {trialist.first_name} {trialist.last_name}
                  </TableCell>
                  <TableCell>{trialist.position || 'Non specificata'}</TableCell>
                  <TableCell>{getStatusBadge(trialist.status)}</TableCell>
                  <TableCell>
                    {new Date(trialist.trial_start_date).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell>{trialist.phone || 'Non specificato'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <EditTrialistForm trialist={trialist} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTrialist(trialist)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredAndSortedTrialists.map((trialist) => (
          <Card key={trialist.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  firstName={trialist.first_name}
                  lastName={trialist.last_name}
                  avatarUrl={trialist.avatar_url}
                  size="sm"
                />
                <div>
                  <h3 className="font-semibold">
                    {trialist.first_name} {trialist.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {trialist.position || 'Posizione non specificata'}
                  </p>
                </div>
              </div>
              {getStatusBadge(trialist.status)}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data inizio:</span>
                <span>{new Date(trialist.trial_start_date).toLocaleDateString('it-IT')}</span>
              </div>
              {trialist.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefono:</span>
                  <span>{trialist.phone}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
              <EditTrialistForm trialist={trialist} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteTrialist(trialist)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredAndSortedTrialists.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' 
              ? 'Nessun trialist trovato con i filtri applicati.' 
              : 'Nessun trialist presente.'
            }
          </p>
        </div>
      )}

      <TrialistDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        trialistName={trialistToDelete ? `${trialistToDelete.first_name} ${trialistToDelete.last_name}` : ''}
        isDeleting={deleteTrialist.isPending}
      />
    </div>
  );
};

export default TrialistsTable;
