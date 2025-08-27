import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Mail, Database, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GDPRConsentProps {
  required: boolean;
  value: boolean;
  onChange: (value: boolean) => void;
  marketingValue?: boolean;
  onMarketingChange?: (value: boolean) => void;
  className?: string;
  compact?: boolean;
}

const GDPRConsent: React.FC<GDPRConsentProps> = ({
  required,
  value,
  onChange,
  marketingValue = false,
  onMarketingChange,
  className = '',
  compact = false
}) => {
  if (compact) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Consenso Obbligatorio */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="gdpr-required"
            checked={value}
            onCheckedChange={(checked) => onChange(!!checked)}
            className="mt-1"
            required={required}
          />
          <div className="flex-1">
            <Label
              htmlFor="gdpr-required"
              className="text-sm leading-relaxed cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-600" />
                <strong>Accetto il trattamento dei dati personali</strong>
                {required && <span className="text-red-500">*</span>}
              </span>
              <span className="text-muted-foreground block mt-1">
                Per la gestione dell'account e comunicazioni di servizio (convocazioni, aggiornamenti squadra).{' '}
                <Link 
                  to="/privacy-policy" 
                  target="_blank"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Privacy Policy <ExternalLink className="h-3 w-3" />
                </Link>
              </span>
            </Label>
          </div>
        </div>

        {/* Consenso Marketing (Opzionale) */}
        {onMarketingChange && (
          <div className="flex items-start space-x-3">
            <Checkbox
              id="gdpr-marketing"
              checked={marketingValue}
              onCheckedChange={(checked) => onMarketingChange(!!checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor="gdpr-marketing"
                className="text-sm leading-relaxed cursor-pointer"
              >
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-blue-600" />
                  <span>Newsletter e aggiornamenti (opzionale)</span>
                </span>
                <span className="text-muted-foreground block mt-1">
                  Ricevi email su nuove funzionalità e eventi speciali.
                </span>
              </Label>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`border-blue-200 bg-blue-50/50 ${className}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-blue-900 font-medium">
          <Shield className="h-4 w-4" />
          <span>Consenso al Trattamento Dati (GDPR)</span>
        </div>

        {/* Consenso Obbligatorio */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="gdpr-required-full"
              checked={value}
              onCheckedChange={(checked) => onChange(!!checked)}
              className="mt-1"
              required={required}
            />
            <div className="flex-1">
              <Label
                htmlFor="gdpr-required-full"
                className="text-sm leading-relaxed cursor-pointer"
              >
                <span className="flex items-center gap-2 font-medium text-green-900">
                  <Database className="h-4 w-4" />
                  <span>Trattamento Dati Necessario</span>
                  {required && <span className="text-red-500">*</span>}
                </span>
                <div className="mt-2 space-y-1 text-green-800">
                  <p>Acconsento al trattamento dei miei dati personali per:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>Gestione account e autenticazione</li>
                    <li>Comunicazioni di servizio (convocazioni, formazioni)</li>
                    <li>Organizzazione allenamenti e partite</li>
                    <li>Statistiche di gioco e valutazioni tecniche</li>
                  </ul>
                  <p className="text-xs mt-2">
                    <strong>Base giuridica:</strong> Esecuzione del contratto di servizio
                  </p>
                </div>
              </Label>
            </div>
          </div>

          {/* Consenso Marketing (Opzionale) */}
          {onMarketingChange && (
            <div className="flex items-start space-x-3 pt-3 border-t border-blue-200">
              <Checkbox
                id="gdpr-marketing-full"
                checked={marketingValue}
                onCheckedChange={(checked) => onMarketingChange(!!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="gdpr-marketing-full"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-medium text-blue-900">
                    <Mail className="h-4 w-4" />
                    <span>Comunicazioni Promozionali (Opzionale)</span>
                  </span>
                  <div className="mt-2 space-y-1 text-blue-800">
                    <p>Acconsento a ricevere:</p>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                      <li>Newsletter con aggiornamenti piattaforma</li>
                      <li>Notifiche su nuove funzionalità</li>
                      <li>Inviti a eventi e tornei speciali</li>
                    </ul>
                    <p className="text-xs mt-2">
                      <strong>Base giuridica:</strong> Consenso esplicito (revocabile in qualsiasi momento)
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* Link Privacy Policy */}
        <div className="pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-700">
            Per maggiori dettagli consulta la nostra{' '}
            <Link 
              to="/privacy-policy" 
              target="_blank"
              className="font-medium hover:underline inline-flex items-center gap-1"
            >
              Privacy Policy <ExternalLink className="h-3 w-3" />
            </Link>.
            Puoi modificare i consensi in qualsiasi momento dal tuo profilo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GDPRConsent;