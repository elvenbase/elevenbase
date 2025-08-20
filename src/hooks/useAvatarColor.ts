
import { useAvatarBackgrounds } from './useAvatarBackgrounds'

export const useAvatarColor = () => {
  const { defaultBackground } = useAvatarBackgrounds()

  // Preferiremo un id stabile se fornito via name (formato "id:DISPLAY")
  const getAvatarColor = (name: string): string => {
    // Se c'è uno sfondo predefinito impostato, usalo
    if (defaultBackground) {
      if (defaultBackground.type === 'color') {
        return defaultBackground.value
      } else if (defaultBackground.type === 'image') {
        // Per le immagini, ritorniamo un colore di fallback con buon contrasto
        return 'hsl(214, 100%, 50%)'
      }
    }

    // Fallback: genera un colore basato sul nome con buon contrasto per testo bianco
    const colors = [
      'hsl(214, 100%, 50%)', // Blu primario
      'hsl(0, 84%, 60%)',    // Rosso accent
      'hsl(210, 100%, 60%)', // Blu chiaro
      'hsl(330, 80%, 60%)',  // Rosa/magenta
      'hsl(120, 70%, 50%)',  // Verde
      'hsl(30, 90%, 60%)',   // Arancione
      'hsl(270, 70%, 60%)',  // Viola
      'hsl(195, 85%, 55%)',  // Ciano
      'hsl(45, 90%, 55%)',   // Giallo scuro
      'hsl(15, 85%, 60%)',   // Rosso-arancione
      'hsl(285, 75%, 60%)',  // Viola-magenta
      'hsl(160, 70%, 50%)'   // Verde acqua
    ]
    const key = name.includes(':') ? name.split(':', 1)[0] : name
    const hash = key.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const getAvatarBackground = (name: string, hasAvatar: boolean = false): { 
    backgroundColor?: string; 
    backgroundImage?: string;
  } => {
    // Se c'è uno sfondo predefinito configurato, usalo SEMPRE (anche con immagine, come da richiesta)
    if (defaultBackground) {
      if (defaultBackground.type === 'color') {
        return { backgroundColor: defaultBackground.value }
      } else if (defaultBackground.type === 'image') {
        return { 
          backgroundImage: `url(${defaultBackground.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      }
    }

    // Se non ci sono custom background, usa il fallback generato
    return { backgroundColor: getAvatarColor(name) }
  }

  const getAvatarFallbackStyle = (name: string, hasAvatar: boolean = false): React.CSSProperties => {
    // Se c'è uno sfondo predefinito con impostazioni testo, usalo SEMPRE
    if (defaultBackground) {
      return {
        color: defaultBackground.text_color || '#ffffff',
        fontSize: defaultBackground.text_size || '14px',
        fontWeight: defaultBackground.text_weight || '600',
        fontFamily: defaultBackground.text_family || 'Inter, system-ui, sans-serif',
        textShadow: defaultBackground.text_shadow || '2px 2px 4px rgba(0,0,0,0.8)'
      }
    }

    // Fallback: usa impostazioni di default per testo bianco
    return { 
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: 'Inter, system-ui, sans-serif',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
    }
  }

  return {
    getAvatarColor,
    getAvatarBackground,
    getAvatarFallbackStyle,
    defaultBackground
  }
}
