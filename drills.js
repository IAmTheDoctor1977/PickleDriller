// Drill library
// role: warmup | main | cooldown
// intensity: low | medium | medium-high | high
// equipment: wall | ball-machine | partner | none
// tags: solo | partner (a drill can be both if it works with either)

const DRILLS = [
  // ───── WARM-UP ─────
  {
    id: 'w1',
    name: 'Slow Cross-Court Dink Rally',
    category: 'warmup',
    role: 'warmup',
    description: 'Soft cross-court dinks at low pace. Focus on contact in front of body and soft hands. No winners — just rally.',
    duration: 5,
    intensity: 'low',
    equipment: ['partner', 'wall'],
    tags: ['solo', 'partner'],
    notes: 'Goal: 30 in a row both wings before stopping.'
  },
  {
    id: 'w2',
    name: 'Mini-Tennis at Transition Line',
    category: 'warmup',
    role: 'warmup',
    description: 'Both players at the transition line. Soft groundstrokes back and forth, controlled bounce.',
    duration: 5,
    intensity: 'low',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Loosens arm and reinforces controlled contact.'
  },
  {
    id: 'w3',
    name: 'Self-Feed Volley Pat-a-Cake',
    category: 'warmup',
    role: 'warmup',
    description: 'Stand 4 ft from wall. Continuous soft volleys at chest height, no bounce. Alternate FH/BH every 5 hits.',
    duration: 4,
    intensity: 'low',
    equipment: ['wall'],
    tags: ['solo'],
    notes: 'Loose grip, paddle out front.'
  },
  {
    id: 'w4',
    name: 'Shadow Footwork',
    category: 'warmup',
    role: 'warmup',
    description: 'No ball. Split-step, side-shuffle, kitchen-corner pivot, recover. Light pace, full range.',
    duration: 4,
    intensity: 'low',
    equipment: ['none'],
    tags: ['solo'],
    notes: 'Wakes up footwork before drilling.'
  },

  // ───── DINKING ─────
  {
    id: 'dk1',
    name: 'Cross-Court Dink Targets',
    category: 'dinking',
    role: 'main',
    description: 'Tape two boxes in opposite kitchen corners. Rally cross-court, both trying to land in the box. Count consecutive box hits.',
    duration: 10,
    intensity: 'medium',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Most cross-court dinks should be deep + wide, not center.'
  },
  {
    id: 'dk2',
    name: 'Straight Dink Rally',
    category: 'dinking',
    role: 'main',
    description: 'Rally dinks straight up the line. Tighter window — forces clean contact. Switch sides halfway.',
    duration: 8,
    intensity: 'medium',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Harder than cross-court because of the shorter window.'
  },
  {
    id: 'dk3',
    name: 'Dink → Speed-Up → Reset',
    category: 'dinking',
    role: 'main',
    description: 'Rally dinks. One player randomly speeds up a ball. Other player must reset it back into the kitchen. Then continue dinking.',
    duration: 10,
    intensity: 'high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'The single best drill for kitchen battles. Trains hands + decision.'
  },
  {
    id: 'dk4',
    name: 'Figure-8 Dinks',
    category: 'dinking',
    role: 'main',
    description: 'One player hits all dinks cross-court; other player hits all dinks straight. Ball traces a figure-8.',
    duration: 8,
    intensity: 'medium',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Switch roles halfway. Trains directional control and footwork.'
  },
  {
    id: 'dk5',
    name: 'Wall Dink Control',
    category: 'dinking',
    role: 'main',
    description: 'Tape 34-inch line on wall. Self-bounce feed, soft dink so the ball lands just over the line and rebounds short. Catch and repeat.',
    duration: 8,
    intensity: 'low',
    equipment: ['wall'],
    tags: ['solo'],
    notes: 'Solo dink touch builder. 30 each wing.'
  },
  {
    id: 'dk6',
    name: 'Topspin Roll Targets',
    category: 'dinking',
    role: 'main',
    description: 'Tape strip on wall 34–40 in. Feed yourself a low ball, brush low-to-high topspin roll into the strip. Below = net, above = pop-up.',
    duration: 10,
    intensity: 'medium',
    equipment: ['wall'],
    tags: ['solo'],
    notes: '30 FH + 30 BH. This is your attackable-ball weapon.'
  },

  // ───── THIRD SHOT ─────
  {
    id: 'th1',
    name: 'Third Shot Drop Reps',
    category: 'third-shot',
    role: 'main',
    description: 'Partner feeds returns to baseline. You hit third-shot drops aiming for kitchen corners. Reset and repeat.',
    duration: 12,
    intensity: 'medium',
    equipment: ['partner', 'ball-machine'],
    tags: ['solo', 'partner'],
    notes: 'Pace over arc. Drop should land in kitchen, not float.'
  },
  {
    id: 'th2',
    name: 'Third Shot Drive Reps',
    category: 'third-shot',
    role: 'main',
    description: 'Partner feeds returns. Drive low and hard at opponent\'s hip or chest. Track first-strike conversion.',
    duration: 10,
    intensity: 'medium-high',
    equipment: ['partner', 'ball-machine'],
    tags: ['solo', 'partner'],
    notes: 'Aim 1–2 paddle-widths above the net. Below the chest of opponent.'
  },
  {
    id: 'th3',
    name: 'Third + Fifth Shot Read',
    category: 'third-shot',
    role: 'main',
    description: 'Partner feeds return. You hit 3rd. Partner hits 5th-ball response (block, dink, attack). You read and react. Live point to 5 shots.',
    duration: 12,
    intensity: 'high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'The 4.5 differentiator: 3rd shot CHOICE based on read.'
  },
  {
    id: 'th4',
    name: 'Drop vs Drive Decision',
    category: 'third-shot',
    role: 'main',
    description: 'Partner varies return depth and height. Shallow/floaty return → drive. Deep low return → drop. Call your choice out loud.',
    duration: 10,
    intensity: 'medium-high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Builds the read. Speak the decision to wire it in.'
  },

  // ───── RESET ─────
  {
    id: 'rs1',
    name: 'Reset Ladder',
    category: 'reset',
    role: 'main',
    description: '7 ft from wall. Drive ball hard, reset the rebound soft into a taped box at net height. 20 in a row each wing.',
    duration: 10,
    intensity: 'medium-high',
    equipment: ['wall'],
    tags: ['solo'],
    notes: 'Builds absorb-then-soften pattern under speed.'
  },
  {
    id: 'rs2',
    name: 'Reaction Reset',
    category: 'reset',
    role: 'main',
    description: 'Stand 5 ft from wall. Drive hard, soft-block the rebound, repeat without losing the ball. Track max streak.',
    duration: 6,
    intensity: 'high',
    equipment: ['wall'],
    tags: ['solo'],
    notes: 'Pure hand-speed and grip pressure work.'
  },
  {
    id: 'rs3',
    name: 'Two-Paddle Reset',
    category: 'reset',
    role: 'main',
    description: 'Partner stands at kitchen and attacks at your chest/hip. You stand at transition line and must reset every ball into the kitchen.',
    duration: 8,
    intensity: 'high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'The truest reset training. Loose grip, paddle out front.'
  },
  {
    id: 'rs4',
    name: 'Reset From Transition Zone',
    category: 'reset',
    role: 'main',
    description: 'Start at baseline. Partner feeds a 5th ball you must reset. Then move forward two steps. Repeat until at kitchen. Reset each one.',
    duration: 8,
    intensity: 'high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Trains the most common 4.0→4.5 leak: getting through no-man\'s-land.'
  },

  // ───── TRANSITION ─────
  {
    id: 'tr1',
    name: 'No-Man\'s-Land Volley/Dink',
    category: 'transition',
    role: 'main',
    description: 'Stand at transition line. Partner at kitchen. Mix of volleys (chest height) and half-volleys (off short hops). Track clean contact.',
    duration: 8,
    intensity: 'medium-high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Bend the knees, get under the ball, paddle out front.'
  },
  {
    id: 'tr2',
    name: 'Forward Progression',
    category: 'transition',
    role: 'main',
    description: 'Start at baseline. Each shot you successfully reset, take 2 steps forward. Goal: reach the kitchen in 4 shots without popping up.',
    duration: 8,
    intensity: 'medium-high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Models real-point progression after a 3rd shot.'
  },
  {
    id: 'tr3',
    name: 'Split-Step Recovery',
    category: 'transition',
    role: 'main',
    description: 'Move forward 2 steps → split step → react to partner\'s feed → reset → repeat. Continuous for the duration.',
    duration: 6,
    intensity: 'high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Split before every ball. Where most rec players leak points.'
  },

  // ───── VOLLEY ─────
  {
    id: 'v1',
    name: 'Two-Ball Volley Loop',
    category: 'volley',
    role: 'main',
    description: 'Continuous wall volleys at chest height, no bounce. 50 FH → 50 BH → 50 alternating. Progress to single-leg.',
    duration: 8,
    intensity: 'medium',
    equipment: ['wall'],
    tags: ['solo'],
    notes: 'Hand speed, balance, paddle quietness.'
  },
  {
    id: 'v2',
    name: 'Punch Volley Targets',
    category: 'volley',
    role: 'main',
    description: 'Tape two boxes on wall: one at knee height, one at shoulder. Punch volley alternating into each target.',
    duration: 8,
    intensity: 'medium',
    equipment: ['wall'],
    tags: ['solo'],
    notes: 'Short, compact swing. No backswing.'
  },
  {
    id: 'v3',
    name: 'Volley Counter-Attack',
    category: 'volley',
    role: 'main',
    description: 'Partner speeds up at your hip/chest. You counter-volley back into their feet or shoulder. Live exchange to 6 shots.',
    duration: 10,
    intensity: 'high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Aim down, not flat. Counter at the source.'
  },
  {
    id: 'v4',
    name: 'Backhand Punch Volley',
    category: 'volley',
    role: 'main',
    description: 'Wall. Backhand-only volleys, paddle face slightly open, short punch through. 30 in a row at chest height.',
    duration: 6,
    intensity: 'medium',
    equipment: ['wall'],
    tags: ['solo'],
    notes: 'BH volley is usually the weaker side at the kitchen.'
  },

  // ───── ATP / ERNE ─────
  {
    id: 'ae1',
    name: 'Erne Footwork',
    category: 'atp-erne',
    role: 'main',
    description: 'Kitchen-corner stance at wall. Feed balls skimming parallel to the wall. Outside foot lands first past the line, plant, punch down.',
    duration: 6,
    intensity: 'medium',
    equipment: ['wall'],
    tags: ['solo'],
    notes: '20 each side. Footwork legality matters more than the swing.'
  },
  {
    id: 'ae2',
    name: 'ATP Setup',
    category: 'atp-erne',
    role: 'main',
    description: 'Partner dinks deep and wide cross-court. When ball travels outside post line, you swing low-to-high around the post.',
    duration: 8,
    intensity: 'high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'No need to clear the net — only to land in the court.'
  },
  {
    id: 'ae3',
    name: 'Erne Read Fakes',
    category: 'atp-erne',
    role: 'main',
    description: 'Partner dinks crosscourt. You fake an Erne every 3rd ball (lean hard, don\'t go). Real Erne when ball is within 12 in of the net.',
    duration: 6,
    intensity: 'medium-high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Fakes open the middle. Reads are the real skill.'
  },

  // ───── SERVE & RETURN ─────
  {
    id: 'sr1',
    name: 'Deep Serve Target',
    category: 'serve-return',
    role: 'main',
    description: 'Tape a strip across the last 3 ft of the service box. Serve aiming for the strip. Track in/out.',
    duration: 8,
    intensity: 'low',
    equipment: ['wall', 'none'],
    tags: ['solo'],
    notes: 'Depth > pace. 30 reps each side.'
  },
  {
    id: 'sr2',
    name: 'Heavy Spin Serve',
    category: 'serve-return',
    role: 'main',
    description: 'Practice topspin and slice serves. Brush up-and-out for topspin; brush down-and-across for slice. Track break/kick on bounce.',
    duration: 8,
    intensity: 'low',
    equipment: ['none'],
    tags: ['solo'],
    notes: 'Variety matters more than max RPM.'
  },
  {
    id: 'sr3',
    name: 'Return Depth Drill',
    category: 'serve-return',
    role: 'main',
    description: 'Tape the back 3 ft of the baseline. Partner serves; you return aiming for the strip. Track percentage in the zone.',
    duration: 8,
    intensity: 'medium',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'Deep return = time to get to the kitchen.'
  },
  {
    id: 'sr4',
    name: 'Return + Recover',
    category: 'serve-return',
    role: 'main',
    description: 'Return serve deep, then sprint to the kitchen line and split-step. Partner third-shots; you take it. Repeat.',
    duration: 8,
    intensity: 'medium-high',
    equipment: ['partner'],
    tags: ['partner'],
    notes: 'The whole return-side sequence in one rep.'
  },

  // ───── FOOTWORK ─────
  {
    id: 'fw1',
    name: 'Split-Step Reaction',
    category: 'footwork',
    role: 'main',
    description: 'Partner or trainer points left/right/up/back randomly. You split-step then move 2 steps in that direction. 30 reps.',
    duration: 5,
    intensity: 'high',
    equipment: ['none', 'partner'],
    tags: ['solo', 'partner'],
    notes: 'Split-step timing is the foundation of every kitchen exchange.'
  },
  {
    id: 'fw2',
    name: 'Ladder Side-Shuffle',
    category: 'footwork',
    role: 'main',
    description: 'Agility ladder or chalk lines. Side-shuffle in/out of boxes. 3 sets each direction.',
    duration: 6,
    intensity: 'high',
    equipment: ['none'],
    tags: ['solo'],
    notes: 'Quick feet, low hips. Don\'t cross feet.'
  },
  {
    id: 'fw3',
    name: 'Kitchen Line Bounce-Step',
    category: 'footwork',
    role: 'main',
    description: 'Stand at kitchen line. Bounce-step in place, occasionally shifting 1 step left or right. Maintain ready position.',
    duration: 5,
    intensity: 'medium-high',
    equipment: ['none'],
    tags: ['solo'],
    notes: 'Builds the active-feet kitchen stance.'
  },
  {
    id: 'fw4',
    name: 'Diagonal Recover Sprints',
    category: 'footwork',
    role: 'main',
    description: 'Start at kitchen middle. Sprint back diagonally to a corner, touch, sprint forward to kitchen, split. 8 reps each side.',
    duration: 6,
    intensity: 'high',
    equipment: ['none'],
    tags: ['solo'],
    notes: 'Lobs and offensive lobs require this exact movement.'
  },

  // ───── COOL-DOWN ─────
  {
    id: 'cd1',
    name: 'Slow Dink Rally',
    category: 'cooldown',
    role: 'cooldown',
    description: 'Easy soft dinks, no targets, no pressure. Just touch and feel.',
    duration: 5,
    intensity: 'low',
    equipment: ['partner', 'wall'],
    tags: ['solo', 'partner'],
    notes: 'Bring HR down, finish on clean contact.'
  },
  {
    id: 'cd2',
    name: 'Easy Serves',
    category: 'cooldown',
    role: 'cooldown',
    description: '10 relaxed serves at 60% pace, focusing on smooth contact. No tracking, no targets.',
    duration: 4,
    intensity: 'low',
    equipment: ['none'],
    tags: ['solo'],
    notes: 'Finish with the simplest motion in the game.'
  },
  {
    id: 'cd3',
    name: 'Static Stretching',
    category: 'cooldown',
    role: 'cooldown',
    description: 'Hip flexors, calves, hamstrings, shoulders, wrists. 30 sec each.',
    duration: 5,
    intensity: 'low',
    equipment: ['none'],
    tags: ['solo'],
    notes: 'Lateral movement breaks down hips and calves first.'
  }
];

const CATEGORIES = [
  { id: 'dinking',      label: 'Dinking' },
  { id: 'third-shot',   label: 'Third Shot' },
  { id: 'reset',        label: 'Reset' },
  { id: 'transition',   label: 'Transition' },
  { id: 'volley',       label: 'Volley' },
  { id: 'atp-erne',     label: 'ATP / Erne' },
  { id: 'serve-return', label: 'Serve & Return' },
  { id: 'footwork',     label: 'Footwork' },
  { id: 'warmup',       label: 'Warm-up' },
  { id: 'cooldown',     label: 'Cool-down' },
];
