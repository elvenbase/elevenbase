import { useAvatarBackgrounds } from './useAvatarBackgrounds'

export const useAvatarColor = () => {
  const { defaultBackground } = useAvatarBackgrounds()

  const getAvatarColor = (name: string): string => {
    // Se c'è uno sfondo predefinito impostato, usalo
    if (defaultBackground) {
      if (defaultBackground.type === 'color') {
        return defaultBackground.value
      } else if (defaultBackground.type === 'image') {
        // Per le immagini, ritorniamo un colore di fallback o potremmo gestire diversamente
        return 'hsl(var(--primary))'
      }
    }

    // Fallback: genera un colore basato sul nome (logica esistente)
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))', 
      'hsl(var(--accent))',
      'hsl(210, 100%, 60%)',
      'hsl(330, 80%, 60%)',
      'hsl(120, 70%, 50%)',
      'hsl(30, 90%, 60%)',
      'hsl(270, 70%, 60%)'
    ]
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const getAvatarBackground = (name: string): { backgroundColor?: string; backgroundImage?: string } => {
    if (defaultBackground) {
      if (defaultBackground.type === 'color') {
        return { backgroundColor: defaultBackground.value }
      } else if (defaultBackground.type === 'image') {
        return { 
          backgroundImage: `url(${defaultBackground.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      }
    }

    // Fallback: usa il colore generato
    return { backgroundColor: getAvatarColor(name) }
  }

  return {
    getAvatarColor,
    getAvatarBackground,
    defaultBackground
  }
}