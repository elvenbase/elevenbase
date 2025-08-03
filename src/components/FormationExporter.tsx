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
        width: '800px',
        height: '600px',
        position: 'relative',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Campo da calcio */}
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
            left: '50%',
            top: '0',
            bottom: '0',
            width: '2px',
            backgroundColor: '#000',
            transform: 'translateX(-50%)'
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

        {/* Area di rigore sinistra */}
        <div 
          style={{
            position: 'absolute',
            left: '0',
            top: '50%',
            width: '100px',
            height: '200px',
            border: '2px solid #000',
            borderLeft: 'none',
            transform: 'translateY(-50%)',
            background: 'transparent'
          }}
        />

        {/* Area di rigore destra */}
        <div 
          style={{
            position: 'absolute',
            right: '0',
            top: '50%',
            width: '100px',
            height: '200px',
            border: '2px solid #000',
            borderRight: 'none',
            transform: 'translateY(-50%)',
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
                gap: '4px'
              }}
            >
              {/* Maglietta */}
              <div 
                style={{
                  width: '45px',
                  height: '45px',
                  backgroundColor: '#1e40af',
                  border: '2px solid #000',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                {player.jersey_number || '?'}
              </div>

              {/* Nome giocatore */}
              <div 
                style={{
                  backgroundColor: '#000',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  textAlign: 'center'
                }}
              >
                {player.first_name} {player.last_name}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FormationExporter