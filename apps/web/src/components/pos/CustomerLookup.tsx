import { useState } from 'react';
import { Search, User, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  points: number;
}

export function CustomerLookup({
  onSelect,
}: {
  onSelect?: (c: Customer) => void;
}) {
  const [mobile, setMobile] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (mobile.length < 3) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/customers/search?q=${mobile}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const matchedCustomer: Customer = {
            id: data[0].id,
            name: data[0].name || 'Unknown',
            mobile: data[0].phone || mobile,
            tier: data[0].tier || 'BRONZE',
            points: data[0].loyalty_points || 0,
          };
          setCustomer(matchedCustomer);
          if (onSelect) onSelect(matchedCustomer);
        } else {
          // If no customer found, let's keep it null for now,
          // but you could potentially allow creating one.
          setCustomer(null);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500';
      case 'GOLD':
        return 'bg-amber-500/20 text-amber-400 border-amber-500';
      case 'SILVER':
        return 'bg-slate-300/20 text-slate-300 border-slate-300';
      default:
        return 'bg-orange-500/20 text-orange-400 border-orange-500'; // BRONZE
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4 shadow-sm">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="tel"
            placeholder="Customer Phone..."
            className="pl-8"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button variant="secondary" onClick={handleSearch} disabled={loading}>
          {loading ? '...' : 'Find'}
        </Button>
      </div>

      {customer && (
        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm leading-none">
                {customer.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {customer.mobile}
              </p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <Badge variant="outline" className={getTierColor(customer.tier)}>
              {customer.tier}
            </Badge>
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {customer.points} pts
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
