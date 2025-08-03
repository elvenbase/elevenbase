
import React from 'react'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
}

interface LineupPlayer {
  player_id: string
  position_x: number
  position_y: number
  player?: Player
}

interface Formation {
  name: string
  positions: Array<{ x: number; y: number }>
}

interface FormationExporterProps {
  lineup: LineupPlayer[]
  formation: Formation
  sessionTitle: string
  teamName?: string
}

const FormationExporter = ({ lineup, formation, sessionTitle, teamName }: FormationExporterProps) => {
  return (
    <div 
      id="formation-export"
      className="bg-transparent"
      style={{
        width: '600px',
        height: '900px',
        position: 'relative',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Campo da calcio verticale */}
      <div 
        className="relative"
        style={{
          width: '100%',
          height: '100%',
          border: '3px solid #000',
          borderRadius: '8px',
          background: 'transparent'
        }}
      >
        {/* Linea di metà campo */}
        <div 
          style={{
            position: 'absolute',
            left: '0',
            right: '0',
            top: '50%',
            height: '2px',
            backgroundColor: '#000',
            transform: 'translateY(-50%)'
          }}
        />
        
        {/* Cerchio di centro campo */}
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '120px',
            height: '120px',
            border: '2px solid #000',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'transparent'
          }}
        />

        {/* Area di rigore in alto */}
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            top: '0',
            width: '200px',
            height: '80px',
            border: '2px solid #000',
            borderTop: 'none',
            transform: 'translateX(-50%)',
            background: 'transparent'
          }}
        />

        {/* Area di rigore in basso */}
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '0',
            width: '200px',
            height: '80px',
            border: '2px solid #000',
            borderBottom: 'none',
            transform: 'translateX(-50%)',
            background: 'transparent'
          }}
        />

        {/* Area piccola in alto */}
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            top: '0',
            width: '100px',
            height: '40px',
            border: '2px solid #000',
            borderTop: 'none',
            transform: 'translateX(-50%)',
            background: 'transparent'
          }}
        />

        {/* Area piccola in basso */}
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '0',
            width: '100px',
            height: '40px',
            border: '2px solid #000',
            borderBottom: 'none',
            transform: 'translateX(-50%)',
            background: 'transparent'
          }}
        />

        {/* Titolo */}
        <div 
          style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#000',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '18px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          {sessionTitle}
          {teamName && ` - ${teamName}`}
        </div>

        {/* Giocatori */}
        {lineup.map((lineupPlayer) => {
          const player = lineupPlayer.player
          if (!player) return null

          return (
            <div
              key={lineupPlayer.player_id}
              style={{
                position: 'absolute',
                left: `${lineupPlayer.position_x}%`,
                top: `${lineupPlayer.position_y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {/* Maglietta */}
              <div 
                style={{
                  width: '50px',
                  height: '55px',
                  backgroundColor: '#1e40af',
                  border: '2px solid #000',
                  borderRadius: '8px 8px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  position: 'relative'
                }}
              >
                {/* Collo della maglietta */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '16px',
                    height: '8px',
                    backgroundColor: '#1e40af',
                    border: '2px solid #000',
                    borderBottom: 'none',
                    borderRadius: '4px 4px 0 0'
                  }}
                />
                {/* Maniche */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '-8px',
                    width: '12px',
                    height: '20px',
                    backgroundColor: '#1e40af',
                    border: '2px solid #000',
                    borderRight: 'none',
                    borderRadius: '6px 0 0 6px'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '-8px',
                    width: '12px',
                    height: '20px',
                    backgroundColor: '#1e40af',
                    border: '2px solid #000',
                    borderLeft: 'none',
                    borderRadius: '0 6px 6px 0'
                  }}
                />
                {player.jersey_number || '?'}
              </div>

              {/* Nome giocatore su due righe */}
              <div 
                style={{
                  backgroundColor: '#000',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  minWidth: '60px',
                  border: '1px solid #000'
                }}
              >
                <div style={{ lineHeight: '1.1' }}>
                  {player.first_name.toUpperCase()}
                </div>
                <div style={{ lineHeight: '1.1' }}>
                  {player.last_name.toUpperCase()}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FormationExporter
