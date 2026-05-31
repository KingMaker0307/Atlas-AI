import type { Exercise } from "@/types/domain";

export const exercises: Exercise[] = [
  {
    id: "barbell-back-squat",
    name: "Barbell Back Squat",
    category: "compound",
    muscles: ["quads", "glutes", "hamstrings", "core"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    setup: [
      "Set the bar just below shoulder height and brace before unracking.",
      "Place feet roughly shoulder-width with toes slightly turned out.",
      "Pull the bar into your upper back and create full-body tension.",
    ],
    instructions: [
      "Brace, descend under control, then drive through midfoot to stand.",
      "Keep knees tracking over toes and maintain a proud chest.",
    ],
    execution: [
      "Unlock hips and knees together.",
      "Reach depth while keeping your brace.",
      "Drive the floor away and finish tall without overextending.",
    ],
    breathing: "Big inhale and brace before each rep, exhale after passing the hardest point.",
    tempo: "3 seconds down, controlled pause, powerful ascent.",
    commonMistakes: [
      "Losing brace at the bottom",
      "Letting knees cave inward",
      "Shifting onto toes",
    ],
    safetyTips: [
      "Use safeties set just below bottom position.",
      "Stop the set when depth or bracing changes.",
    ],
    progressionTips: [
      "Add 2.5-5 lb when all target reps land with 1 RIR or better.",
      "Deload 8-12% after two stalled squat sessions.",
    ],
    aliases: ["squats", "squat", "back squat", "barbell squat"],
  },
  {
    id: "bench-press",
    name: "Bench Press",
    category: "compound",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    setup: [
      "Plant feet, set shoulder blades down and back, and keep eyes under the bar.",
      "Grip slightly wider than shoulder-width with stacked wrists.",
    ],
    instructions: [
      "Lower the bar to lower chest with control.",
      "Press up and slightly back while keeping shoulders pinned.",
    ],
    execution: [
      "Unrack with locked shoulders.",
      "Touch consistently without bouncing.",
      "Finish each rep with elbows extended and upper back tight.",
    ],
    breathing: "Brace before the descent, hold through the press, reset at the top.",
    tempo: "2-3 seconds down, soft touch, crisp press.",
    commonMistakes: ["Flaring elbows early", "Bouncing off the chest", "Losing leg drive"],
    safetyTips: ["Use a spotter or safeties for hard sets.", "Avoid max attempts when alone."],
    progressionTips: [
      "Add 2.5 lb when top-set reps exceed the target range.",
      "Use a back-off set if bar speed slows sharply.",
    ],
    aliases: ["chest press", "flat bench press", "chest flat press", "bench"],
  },
  {
    id: "deadlift",
    name: "Conventional Deadlift",
    category: "compound",
    muscles: ["back", "glutes", "hamstrings", "core"],
    equipment: ["barbell"],
    difficulty: "advanced",
    setup: [
      "Stand with midfoot under the bar.",
      "Hinge to grip, pull slack out, and wedge hips into position.",
    ],
    instructions: [
      "Push the floor away while keeping the bar close.",
      "Lock out with glutes, not with a backward lean.",
    ],
    execution: [
      "Create lat tension before the pull.",
      "Keep the bar path vertical.",
      "Lower with control by hinging first.",
    ],
    breathing: "Inhale and brace before each rep, reset on the floor.",
    tempo: "Controlled setup, strong pull, deliberate eccentric.",
    commonMistakes: ["Jerking the bar", "Hips shooting up", "Hyperextending at lockout"],
    safetyTips: ["Stop when back position changes.", "Keep volume conservative near failure."],
    progressionTips: [
      "Progress slowly because systemic fatigue is high.",
      "Reduce volume if recovery score is below 60.",
    ],
    aliases: ["deadlift", "dead-lift", "barbell deadlift"],
  },
  {
    id: "pull-up",
    name: "Pull-Up",
    category: "compound",
    muscles: ["back", "biceps", "core"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    setup: [
      "Use a shoulder-width overhand grip.",
      "Start from a dead hang with ribs stacked over hips.",
    ],
    instructions: [
      "Pull elbows toward ribs and clear the bar with your chin.",
      "Lower under control until arms are extended.",
    ],
    execution: [
      "Depress shoulders before bending elbows.",
      "Keep legs quiet.",
      "Control the bottom instead of dropping.",
    ],
    breathing: "Exhale as you pull, inhale on the descent.",
    tempo: "1 second up, 2-3 seconds down.",
    commonMistakes: ["Kipping unintentionally", "Short range of motion", "Shrugging at the top"],
    safetyTips: ["Use assistance before form breaks.", "Avoid painful shoulder ranges."],
    progressionTips: [
      "Add reps until sets reach 10, then add small external load.",
      "Use eccentrics if full reps stall.",
    ],
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    category: "compound",
    muscles: ["hamstrings", "glutes", "back"],
    equipment: ["barbell", "dumbbell"],
    difficulty: "intermediate",
    setup: [
      "Stand tall with weight held close to thighs.",
      "Soften knees and brace ribs down.",
    ],
    instructions: [
      "Hinge hips back until hamstrings are loaded.",
      "Return by driving hips forward while keeping lats engaged.",
    ],
    execution: [
      "Keep shins nearly vertical.",
      "Pause when the stretch peaks.",
      "Avoid turning the rep into a squat.",
    ],
    breathing: "Brace before lowering, exhale after passing midrange.",
    tempo: "3 seconds down, 1 second stretch, 1-2 seconds up.",
    commonMistakes: ["Rounding low back", "Going too low", "Letting weight drift away"],
    safetyTips: ["Use straps if grip limits the target muscle.", "Reduce range when hamstrings pull pelvis under."],
    progressionTips: ["Add load after all reps keep a stable hinge.", "Use tempo before adding weight."],
  },
  {
    id: "overhead-press",
    name: "Standing Overhead Press",
    category: "compound",
    muscles: ["shoulders", "triceps", "core"],
    equipment: ["barbell", "dumbbell"],
    difficulty: "intermediate",
    setup: [
      "Grip just outside shoulders with forearms vertical.",
      "Squeeze glutes and brace ribs down.",
    ],
    instructions: [
      "Press overhead while moving your head slightly back, then through.",
      "Lock out with biceps near ears.",
    ],
    execution: [
      "Start from upper chest.",
      "Keep wrists stacked.",
      "Do not turn the press into a push press unless planned.",
    ],
    breathing: "Brace before each rep, exhale near lockout.",
    tempo: "Controlled down, firm press up.",
    commonMistakes: ["Overarching", "Pressing around the face", "Losing glute tension"],
    safetyTips: ["Use conservative jumps.", "Avoid painful shoulder impingement positions."],
    progressionTips: ["Use micro-loading when possible.", "Add volume before load when progress slows."],
  },
  {
    id: "dumbbell-row",
    name: "One-Arm Dumbbell Row",
    category: "compound",
    muscles: ["back", "biceps"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: [
      "Support one hand and knee on a bench or staggered stance.",
      "Let the working shoulder reach without losing spine position.",
    ],
    instructions: [
      "Row elbow toward hip.",
      "Lower until lats stretch while staying controlled.",
    ],
    execution: [
      "Keep torso quiet.",
      "Pause briefly near the ribs.",
      "Avoid twisting to chase range.",
    ],
    breathing: "Exhale on the row, inhale as you lower.",
    tempo: "1-2 seconds up, 2 seconds down.",
    commonMistakes: ["Shrugging", "Rotating torso", "Using too much momentum"],
    safetyTips: ["Keep neck neutral.", "Use straps if grip steals focus."],
    progressionTips: ["Progress reps first, then load.", "Add a pause when weight jumps are large."],
    aliases: ["db row", "db rows", "one arm row", "dumbbell row"],
  },
  {
    id: "plank",
    name: "Plank",
    category: "mobility",
    muscles: ["core", "glutes", "shoulders"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: [
      "Place elbows below shoulders.",
      "Set ribs down and squeeze glutes.",
    ],
    instructions: [
      "Hold a straight line from shoulders to heels.",
      "Breathe calmly without losing brace.",
    ],
    execution: [
      "Push elbows gently into the floor.",
      "Keep pelvis neutral.",
      "End the set before hips sag.",
    ],
    breathing: "Short nasal breaths while keeping abdominal pressure.",
    tempo: "Isometric hold.",
    commonMistakes: ["Sagging hips", "Holding breath", "Neck craning"],
    safetyTips: ["Stop if low back takes over.", "Elevate elbows to regress."],
    progressionTips: ["Add 5-10 seconds per week.", "Progress to long-lever planks before adding load."],
  },
  {
    id: "barbell-row",
    name: "Barbell Bent-Over Row",
    category: "compound",
    muscles: ["back", "biceps", "core"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    setup: ["Hinge at the hips with the bar hanging at arms-length."],
    instructions: ["Row the bar to your lower chest, squeezing shoulder blades together."],
    execution: ["Keep torso angle constant.", "Lower under control."],
    breathing: "Exhale on the pull, inhale as you lower.",
    tempo: "Controlled pull, 2-second lower.",
    commonMistakes: ["Using momentum", "Standing too upright"],
    safetyTips: ["Keep back flat.", "Reduce weight if form breaks."],
    progressionTips: ["Add 5 lb when you hit all target reps."],
  },
  {
    id: "barbell-curl",
    name: "Barbell Curl",
    category: "isolation",
    muscles: ["biceps"],
    equipment: ["barbell"],
    difficulty: "beginner",
    setup: ["Stand with bar at arm's length, shoulder-width grip."],
    instructions: ["Curl the bar to shoulder height without swinging."],
    execution: ["Keep elbows pinned at your sides.", "Lower slowly."],
    breathing: "Exhale on the curl, inhale on the lower.",
    tempo: "2 seconds up, 3 seconds down.",
    commonMistakes: ["Swinging the body", "Flaring elbows"],
    safetyTips: ["Use a weight you can control.", "Avoid locking out aggressively."],
    progressionTips: ["Progress reps before weight."],
  },
  {
    id: "front-squat",
    name: "Barbell Front Squat",
    category: "compound",
    muscles: ["quads", "core", "glutes"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    setup: ["Rack the bar on front delts with elbows high in a clean grip or cross-arm grip."],
    instructions: ["Descend with an upright torso, drive up through midfoot."],
    execution: ["Keep elbows high throughout.", "Hit parallel or below."],
    breathing: "Brace before descent, exhale after sticking point.",
    tempo: "3 seconds down, controlled ascent.",
    commonMistakes: ["Elbows dropping", "Forward lean", "Wrist pain from grip"],
    safetyTips: ["Use safeties.", "Bail forward if you fail a rep."],
    progressionTips: ["Add 5 lb when all reps are clean."],
  },
  {
    id: "incline-bench-press",
    name: "Incline Barbell Bench Press",
    category: "compound",
    muscles: ["chest", "shoulders", "triceps"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    setup: ["Set bench to 30–45 degrees. Grip slightly wider than shoulder-width."],
    instructions: ["Lower bar to upper chest, press back up."],
    execution: ["Keep shoulder blades retracted.", "Touch upper chest consistently."],
    breathing: "Inhale on descent, exhale through the press.",
    tempo: "2 seconds down, press up with control.",
    commonMistakes: ["Bench angle too steep", "Flaring elbows"],
    safetyTips: ["Use a spotter on heavy sets."],
    progressionTips: ["Progress after flat bench stalls to break plateaus."],
  },
  {
    id: "close-grip-bench-press",
    name: "Close-Grip Bench Press",
    category: "compound",
    muscles: ["triceps", "chest", "shoulders"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    setup: ["Grip the bar shoulder-width or slightly narrower."],
    instructions: ["Lower to mid-chest keeping elbows tucked, press up."],
    execution: ["Focus on triceps lockout.", "Keep wrists stacked over elbows."],
    breathing: "Inhale down, exhale up.",
    tempo: "2 seconds down, powerful press.",
    commonMistakes: ["Grip too narrow causing wrist pain", "Flaring elbows"],
    safetyTips: ["Use a spotter.", "Stop if wrists hurt."],
    progressionTips: ["Great accessory for improving lockout strength."],
  },
  {
    id: "sumo-deadlift",
    name: "Sumo Deadlift",
    category: "compound",
    muscles: ["glutes", "quads", "hamstrings", "back"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    setup: ["Wide stance, toes pointed out, grip inside the knees."],
    instructions: ["Push the floor away, keeping chest up and hips close to the bar."],
    execution: ["Wedge hips to the bar.", "Finish with glutes."],
    breathing: "Brace before each pull, reset on the floor.",
    tempo: "Controlled setup, strong pull.",
    commonMistakes: ["Hips shooting up", "Knees caving in"],
    safetyTips: ["Warm up hip adductors.", "Stop if inner thigh pain appears."],
    progressionTips: ["Alternate with conventional for variety."],
  },
  {
    id: "dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    category: "compound",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: ["Sit on bench with dumbbells on thighs, kick back to position."],
    instructions: ["Press dumbbells up, touch them lightly at the top, lower with control."],
    execution: ["Keep shoulder blades pinched.", "Lower until upper arms are parallel."],
    breathing: "Exhale on press, inhale on descent.",
    tempo: "2 seconds down, controlled press.",
    commonMistakes: ["Dumbbells drifting apart", "Losing shoulder position"],
    safetyTips: ["Drop to sides if you fail.", "Start light to learn the path."],
    progressionTips: ["Progress in 5 lb jumps per dumbbell."],
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    category: "compound",
    muscles: ["chest", "shoulders", "triceps"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: ["Set bench to 30–45 degrees, dumbbells at shoulder level."],
    instructions: ["Press up and inward slightly, lower to chest level."],
    execution: ["Keep wrists neutral.", "Squeeze chest at the top."],
    breathing: "Exhale pressing up, inhale lowering.",
    tempo: "Controlled throughout.",
    commonMistakes: ["Angle too steep", "Arching excessively"],
    safetyTips: ["Use a weight you can control for all reps."],
    progressionTips: ["Alternate with barbell incline for variety."],
  },
  {
    id: "dumbbell-shoulder-press",
    name: "Dumbbell Shoulder Press",
    category: "compound",
    muscles: ["shoulders", "triceps"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: ["Seated or standing, dumbbells at shoulder height, palms forward."],
    instructions: ["Press overhead until arms are extended, lower to ears."],
    execution: ["Keep core braced.", "Don't hyperextend the low back."],
    breathing: "Exhale on press, inhale lowering.",
    tempo: "2 seconds up, 2 seconds down.",
    commonMistakes: ["Arching the back", "Not reaching full extension"],
    safetyTips: ["Use a back-supported seat for heavy sets."],
    progressionTips: ["Progress when all reps are completed with strict form."],
  },
  {
    id: "dumbbell-curl",
    name: "Dumbbell Bicep Curl",
    category: "isolation",
    muscles: ["biceps"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: ["Stand with dumbbells at sides, palms facing forward."],
    instructions: ["Curl both dumbbells up, squeeze at the top, lower slowly."],
    execution: ["Keep elbows stationary.", "Supinate the wrist at the top."],
    breathing: "Exhale on curl, inhale on lower.",
    tempo: "2 seconds up, 3 seconds down.",
    commonMistakes: ["Swinging", "Moving elbows forward"],
    safetyTips: ["Control the weight throughout."],
    progressionTips: ["Alternate with hammer curls for full bicep development."],
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    category: "isolation",
    muscles: ["biceps"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: ["Stand with dumbbells at sides, palms facing each other (neutral grip)."],
    instructions: ["Curl up keeping neutral grip, lower under control."],
    execution: ["Keep elbows pinned.", "Don't swing."],
    breathing: "Exhale curling, inhale lowering.",
    tempo: "2 seconds up, 2 seconds down.",
    commonMistakes: ["Swinging the body", "Rushing reps"],
    safetyTips: ["Use controlled weight."],
    progressionTips: ["Targets brachioradialis and brachialis for arm thickness."],
  },
  {
    id: "dumbbell-lunge",
    name: "Dumbbell Lunge",
    category: "compound",
    muscles: ["quads", "glutes", "hamstrings"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: ["Hold dumbbells at sides, stand tall."],
    instructions: ["Step forward, lower until both knees are ~90°, push back to start."],
    execution: ["Keep torso upright.", "Front knee tracks over toes."],
    breathing: "Inhale on descent, exhale driving back.",
    tempo: "Controlled step, strong push back.",
    commonMistakes: ["Knee collapsing inward", "Leaning forward"],
    safetyTips: ["Start with bodyweight to learn the pattern."],
    progressionTips: ["Progress to walking lunges for added challenge."],
  },
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    category: "compound",
    muscles: ["quads", "glutes", "core"],
    equipment: ["dumbbell", "kettlebell"],
    difficulty: "beginner",
    setup: ["Hold a dumbbell or kettlebell at chest height with both hands."],
    instructions: ["Squat down keeping the weight at chest, stand back up."],
    execution: ["Keep elbows inside knees.", "Push knees out at the bottom."],
    breathing: "Inhale down, exhale standing.",
    tempo: "3 seconds down, controlled ascent.",
    commonMistakes: ["Rounding the back", "Heels lifting"],
    safetyTips: ["Great for learning squat mechanics safely."],
    progressionTips: ["Progress to barbell squats when goblet gets too light."],
  },
  {
    id: "dumbbell-fly",
    name: "Dumbbell Chest Fly",
    category: "isolation",
    muscles: ["chest"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: ["Lie on a flat bench, dumbbells overhead with slight elbow bend."],
    instructions: ["Lower dumbbells out to sides in an arc, squeeze back up."],
    execution: ["Maintain the same elbow bend throughout.", "Feel the chest stretch."],
    breathing: "Inhale opening, exhale closing.",
    tempo: "3 seconds open, 2 seconds close.",
    commonMistakes: ["Going too deep", "Straightening arms"],
    safetyTips: ["Use lighter weight than pressing movements."],
    progressionTips: ["Great finisher after pressing work."],
  },
  {
    id: "lateral-raise",
    name: "Dumbbell Lateral Raise",
    category: "isolation",
    muscles: ["shoulders"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: ["Stand with dumbbells at sides, slight bend in elbows."],
    instructions: ["Raise arms out to the sides until shoulder height, lower slowly."],
    execution: ["Lead with the elbows.", "Don't go above shoulder level."],
    breathing: "Exhale raising, inhale lowering.",
    tempo: "2 seconds up, 3 seconds down.",
    commonMistakes: ["Using momentum", "Shrugging traps"],
    safetyTips: ["Use light weight with strict form."],
    progressionTips: ["Volume responds better than heavy weight here."],
  },
  {
    id: "dumbbell-tricep-extension",
    name: "Overhead Dumbbell Tricep Extension",
    category: "isolation",
    muscles: ["triceps"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: ["Hold one dumbbell overhead with both hands behind the head."],
    instructions: ["Extend arms overhead, lower behind the head, repeat."],
    execution: ["Keep elbows close to ears.", "Full range of motion."],
    breathing: "Exhale extending, inhale lowering.",
    tempo: "2 seconds up, 2 seconds down.",
    commonMistakes: ["Flaring elbows", "Using too much weight"],
    safetyTips: ["Start light to protect the elbow joint."],
    progressionTips: ["Progress to cable overhead extensions for constant tension."],
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    category: "compound",
    muscles: ["back", "biceps"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: ["Sit at the machine, grip the bar slightly wider than shoulders."],
    instructions: ["Pull bar to upper chest, squeezing lats, return slowly."],
    execution: ["Lean back slightly.", "Pull elbows to the floor."],
    breathing: "Exhale pulling down, inhale releasing.",
    tempo: "2 seconds down, 3 seconds up.",
    commonMistakes: ["Pulling behind the neck", "Using momentum"],
    safetyTips: ["Always pull to the front."],
    progressionTips: ["Progress to pull-ups when you can pull bodyweight."],
  },
  {
    id: "cable-row",
    name: "Seated Cable Row",
    category: "compound",
    muscles: ["back", "biceps"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: ["Sit with feet braced, grab the handle with arms extended."],
    instructions: ["Pull handle to lower chest, squeeze shoulder blades, return."],
    execution: ["Keep torso stable.", "Don't lean excessively."],
    breathing: "Exhale on the pull, inhale releasing.",
    tempo: "2 seconds pull, 2 seconds release.",
    commonMistakes: ["Excessive body sway", "Rounding the back"],
    safetyTips: ["Keep core braced throughout."],
    progressionTips: ["Try different handle attachments for variety."],
  },
  {
    id: "cable-fly",
    name: "Cable Chest Fly",
    category: "isolation",
    muscles: ["chest"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: ["Set cables at chest height, step forward with one foot."],
    instructions: ["Bring handles together in front of chest in an arc, return slowly."],
    execution: ["Maintain slight elbow bend.", "Squeeze chest at the midpoint."],
    breathing: "Exhale closing, inhale opening.",
    tempo: "2 seconds close, 3 seconds open.",
    commonMistakes: ["Straightening the arms", "Going too heavy"],
    safetyTips: ["Use a weight that allows smooth arcs."],
    progressionTips: ["Vary cable height for upper/lower chest focus."],
  },
  {
    id: "face-pull",
    name: "Cable Face Pull",
    category: "isolation",
    muscles: ["shoulders", "back"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: ["Set cable at face height with a rope attachment."],
    instructions: ["Pull the rope to your face, externally rotating at the end."],
    execution: ["Elbows high.", "Squeeze rear delts at the end."],
    breathing: "Exhale pulling, inhale returning.",
    tempo: "2 seconds pull, hold 1 second, 2 seconds return.",
    commonMistakes: ["Pulling too low", "Using too much weight"],
    safetyTips: ["Keep it light — this is a health movement for shoulders."],
    progressionTips: ["Do these every session for shoulder health."],
  },
  {
    id: "tricep-pushdown",
    name: "Cable Tricep Pushdown",
    category: "isolation",
    muscles: ["triceps"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: ["Stand at cable with bar or rope attachment at chest height."],
    instructions: ["Push down until arms are fully extended, return to 90°."],
    execution: ["Keep elbows pinned at sides.", "Squeeze at the bottom."],
    breathing: "Exhale pushing down, inhale returning.",
    tempo: "2 seconds down, 2 seconds up.",
    commonMistakes: ["Leaning over the cable", "Elbows drifting forward"],
    safetyTips: ["Moderate weight with strict form beats heavy cheating."],
    progressionTips: ["Try different attachments: rope, bar, V-bar."],
  },
  {
    id: "leg-press",
    name: "Leg Press",
    category: "compound",
    muscles: ["quads", "glutes", "hamstrings"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: ["Sit in the machine with feet shoulder-width on the platform."],
    instructions: ["Lower the platform until knees are ~90°, press back up."],
    execution: ["Don't lock knees at the top.", "Keep lower back on the pad."],
    breathing: "Inhale lowering, exhale pressing.",
    tempo: "3 seconds down, controlled press.",
    commonMistakes: ["Going too deep and rounding lower back", "Locking knees"],
    safetyTips: ["Use the safety catches.", "Don't round your lower back."],
    progressionTips: ["Vary foot position to shift emphasis to different muscles."],
  },
  {
    id: "leg-curl",
    name: "Lying Leg Curl",
    category: "isolation",
    muscles: ["hamstrings"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: ["Lie face down, pad above the heels."],
    instructions: ["Curl heels toward glutes, squeeze at the top, lower slowly."],
    execution: ["Don't lift hips off the pad.", "Full range of motion."],
    breathing: "Exhale curling, inhale lowering.",
    tempo: "2 seconds up, 3 seconds down.",
    commonMistakes: ["Using momentum", "Lifting hips"],
    safetyTips: ["Stop if you feel a cramp."],
    progressionTips: ["Try single-leg for imbalance correction."],
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    category: "isolation",
    muscles: ["quads"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: ["Sit with pad on shins just above ankles."],
    instructions: ["Extend legs until straight, squeeze quads, lower slowly."],
    execution: ["Don't hyperextend.", "Pause at full extension."],
    breathing: "Exhale extending, inhale lowering.",
    tempo: "2 seconds up, 3 seconds down.",
    commonMistakes: ["Swinging the weight", "Partial reps"],
    safetyTips: ["Use moderate weight to protect the knee joint."],
    progressionTips: ["Great as a pre-exhaust before squats or a finisher."],
  },
  {
    id: "calf-raise-machine",
    name: "Machine Calf Raise",
    category: "isolation",
    muscles: ["calves"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: ["Stand on the platform with toes on edge, shoulders under pads."],
    instructions: ["Rise onto toes, pause at the top, lower below platform level."],
    execution: ["Full stretch at the bottom.", "Hold the contraction at the top."],
    breathing: "Exhale rising, inhale lowering.",
    tempo: "2 seconds up, 2-second hold, 3 seconds down.",
    commonMistakes: ["Bouncing at the bottom", "Partial range"],
    safetyTips: ["Go light until Achilles is warmed up."],
    progressionTips: ["Calves respond well to high reps (12-20)."],
  },
  {
    id: "hip-thrust",
    name: "Barbell Hip Thrust",
    category: "compound",
    muscles: ["glutes", "hamstrings"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    setup: ["Sit with upper back on bench, barbell over hips with a pad."],
    instructions: ["Drive hips up until fully extended, squeeze glutes, lower."],
    execution: ["Keep chin tucked.", "Feet flat, knees at 90° at the top."],
    breathing: "Exhale thrusting up, inhale lowering.",
    tempo: "2 seconds up, hold 1 second, 2 seconds down.",
    commonMistakes: ["Hyperextending the back", "Not reaching full hip extension"],
    safetyTips: ["Use a thick bar pad for comfort."],
    progressionTips: ["Progress by adding weight or using a pause at the top."],
  },
  {
    id: "push-up",
    name: "Push-Up",
    category: "compound",
    muscles: ["chest", "triceps", "shoulders", "core"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: ["Hands slightly wider than shoulders, body in a straight line."],
    instructions: ["Lower until chest nearly touches the floor, push back up."],
    execution: ["Keep core tight.", "Full lockout at the top."],
    breathing: "Inhale lowering, exhale pressing up.",
    tempo: "2 seconds down, 1 second up.",
    commonMistakes: ["Sagging hips", "Flaring elbows too wide"],
    safetyTips: ["Elevate hands to regress if needed."],
    progressionTips: ["Progress to deficit push-ups, then weighted."],
  },
  {
    id: "dip",
    name: "Parallel Bar Dip",
    category: "compound",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    setup: ["Grip the bars, support yourself with arms locked."],
    instructions: ["Lower until upper arms are parallel, press back up."],
    execution: ["Lean forward for more chest.", "Stay upright for more triceps."],
    breathing: "Inhale lowering, exhale pressing up.",
    tempo: "2 seconds down, controlled press.",
    commonMistakes: ["Going too deep", "Shoulders rounding forward"],
    safetyTips: ["Avoid if you have shoulder issues.", "Use an assist band to regress."],
    progressionTips: ["Add weight with a belt when bodyweight becomes easy."],
  },
  {
    id: "chin-up",
    name: "Chin-Up",
    category: "compound",
    muscles: ["back", "biceps"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    setup: ["Grip the bar underhand (supinated), shoulder-width."],
    instructions: ["Pull chin above the bar, lower with control."],
    execution: ["Initiate with lats.", "Full hang at the bottom."],
    breathing: "Exhale pulling up, inhale lowering.",
    tempo: "Controlled pull, 3-second descent.",
    commonMistakes: ["Kipping", "Not going to full hang"],
    safetyTips: ["Use a band for assistance if needed."],
    progressionTips: ["Progress to weighted chin-ups."],
  },
  {
    id: "bodyweight-squat",
    name: "Bodyweight Squat",
    category: "compound",
    muscles: ["quads", "glutes", "hamstrings"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: ["Stand with feet shoulder-width, toes slightly out."],
    instructions: ["Squat until thighs are parallel or below, stand back up."],
    execution: ["Keep chest up.", "Push knees out over toes."],
    breathing: "Inhale down, exhale up.",
    tempo: "2 seconds down, 1 second up.",
    commonMistakes: ["Knees caving", "Heels lifting"],
    safetyTips: ["Hold a doorframe for balance if needed."],
    progressionTips: ["Progress to goblet squats, then barbell squats."],
  },
  {
    id: "lunge",
    name: "Bodyweight Lunge",
    category: "compound",
    muscles: ["quads", "glutes", "hamstrings"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: ["Stand tall, feet hip-width apart."],
    instructions: ["Step forward, lower until both knees are ~90°, push back."],
    execution: ["Keep torso upright.", "Control the descent."],
    breathing: "Inhale stepping, exhale pushing back.",
    tempo: "Controlled throughout.",
    commonMistakes: ["Knee shooting past toes", "Leaning forward"],
    safetyTips: ["Start shallow and increase depth over time."],
    progressionTips: ["Progress to walking lunges, then add dumbbells."],
  },
  {
    id: "pike-push-up",
    name: "Pike Push-Up",
    category: "compound",
    muscles: ["shoulders", "triceps"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    setup: ["Get in a push-up position, walk hands back to form an inverted V."],
    instructions: ["Lower your head toward the floor, press back up."],
    execution: ["Keep hips high.", "Look at your feet."],
    breathing: "Inhale lowering, exhale pressing.",
    tempo: "2 seconds down, controlled press.",
    commonMistakes: ["Hips dropping", "Not going deep enough"],
    safetyTips: ["Elevate feet to increase difficulty progressively."],
    progressionTips: ["Progress to handstand push-ups over time."],
  },
  {
    id: "inverted-row",
    name: "Inverted Row",
    category: "compound",
    muscles: ["back", "biceps", "core"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: ["Set a bar at waist height, hang underneath with arms extended."],
    instructions: ["Pull chest to the bar, squeeze shoulder blades, lower."],
    execution: ["Keep body rigid like a plank.", "Full range of motion."],
    breathing: "Exhale pulling, inhale lowering.",
    tempo: "2 seconds up, 2 seconds down.",
    commonMistakes: ["Sagging hips", "Pulling with arms only"],
    safetyTips: ["Adjust bar height to modify difficulty."],
    progressionTips: ["Lower the bar to increase difficulty as you get stronger."],
  },
  {
    id: "glute-bridge",
    name: "Glute Bridge",
    category: "isolation",
    muscles: ["glutes", "hamstrings"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: ["Lie face up, knees bent, feet flat on the floor."],
    instructions: ["Drive hips up squeezing glutes, hold briefly, lower."],
    execution: ["Don't hyperextend.", "Squeeze at the top."],
    breathing: "Exhale lifting, inhale lowering.",
    tempo: "2 seconds up, 1-second hold, 2 seconds down.",
    commonMistakes: ["Pushing through toes", "Hyperextending"],
    safetyTips: ["Safe for most populations including rehab."],
    progressionTips: ["Progress to single-leg, then barbell hip thrusts."],
  },
  {
    id: "diamond-push-up",
    name: "Diamond Push-Up",
    category: "compound",
    muscles: ["triceps", "chest"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    setup: ["Hands together under chest forming a diamond shape."],
    instructions: ["Lower chest to hands, press back up."],
    execution: ["Keep elbows tucked.", "Full range of motion."],
    breathing: "Inhale lowering, exhale pressing.",
    tempo: "2 seconds down, 1 second up.",
    commonMistakes: ["Flaring elbows", "Partial reps"],
    safetyTips: ["Regress to regular push-ups if too hard."],
    progressionTips: ["Master before progressing to dips."],
  },
  {
    id: "burpee",
    name: "Burpee",
    category: "cardio",
    muscles: ["full body"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    setup: ["Stand with feet shoulder-width."],
    instructions: ["Drop into a push-up, perform push-up, jump feet to hands, jump up."],
    execution: ["Move explosively.", "Land softly on the jump."],
    breathing: "Breathe rhythmically throughout.",
    tempo: "Fast and explosive.",
    commonMistakes: ["Skipping the push-up", "Sloppy landing"],
    safetyTips: ["Modify by stepping instead of jumping if needed."],
    progressionTips: ["Add a tuck jump for extra intensity."],
  },
  {
    id: "mountain-climber",
    name: "Mountain Climber",
    category: "cardio",
    muscles: ["core", "shoulders", "quads"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: ["Get in a push-up position."],
    instructions: ["Alternate driving knees to chest in a running motion."],
    execution: ["Keep hips level.", "Move quickly."],
    breathing: "Breathe rhythmically.",
    tempo: "Fast alternating motion.",
    commonMistakes: ["Hips bouncing up", "Slowing tempo"],
    safetyTips: ["Great for conditioning with low impact."],
    progressionTips: ["Increase speed or duration progressively."],
  },
  {
    id: "kettlebell-swing",
    name: "Kettlebell Swing",
    category: "compound",
    muscles: ["glutes", "hamstrings", "core", "shoulders"],
    equipment: ["kettlebell"],
    difficulty: "intermediate",
    setup: ["Stand with feet wider than shoulders, kettlebell between feet."],
    instructions: ["Hinge and hike the bell, drive hips forward explosively to swing to chest height."],
    execution: ["Power comes from the hips, not the arms.", "Lock out glutes at the top."],
    breathing: "Sharp exhale at the top, inhale on the backswing.",
    tempo: "Explosive hip snap, controlled backswing.",
    commonMistakes: ["Squatting instead of hinging", "Using arms to lift"],
    safetyTips: ["Master the hip hinge before adding speed."],
    progressionTips: ["Progress weight or to single-arm swings."],
  },
  {
    id: "hanging-leg-raise",
    name: "Hanging Leg Raise",
    category: "isolation",
    muscles: ["core"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    setup: ["Hang from a pull-up bar with arms fully extended."],
    instructions: ["Raise legs until parallel or higher, lower with control."],
    execution: ["Minimize swinging.", "Use abs, not hip flexors."],
    breathing: "Exhale raising, inhale lowering.",
    tempo: "2 seconds up, 3 seconds down.",
    commonMistakes: ["Excessive swinging", "Using momentum"],
    safetyTips: ["Start with knee raises if too hard."],
    progressionTips: ["Progress to toes-to-bar."],
  },
  // ─── ADDED EXPANDED EXERCISES (50 Additional Movements) ───
  {
    id: "barbell-decline-bench-press",
    name: "Decline Barbell Bench Press",
    category: "compound",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    setup: [
      "Secure shins under the pads of a decline bench set to -15 to -30 degrees.",
      "Lie back, retract shoulder blades, and grip the bar slightly wider than shoulder-width."
    ],
    instructions: [
      "Unrack and lower the bar to your lower sternum under control.",
      "Drive the barbell straight up, locking your elbows out without losing shoulder blade tension."
    ],
    execution: [
      "Avoid letting the bar drift toward your throat.",
      "Maintain tight glutes and a flat upper back against the pad."
    ],
    breathing: "Inhale and brace on the eccentric descent, exhale forcefully after passing the sticking point.",
    tempo: "3-0-1-0",
    commonMistakes: [
      "Letting the bar drop too quickly",
      "Wrists buckling backward",
      "Using an excessively steep decline angle"
    ],
    safetyTips: [
      "Always secure a spotter or utilize safety racks.",
      "Avoid a suicide (thumbless) grip."
    ],
    progressionTips: [
      "Increase loading when target reps are finished with clean biomechanics.",
      "Good for targeting the sternocostal head of the pectoralis major."
    ]
  },
  {
    id: "skull-crusher",
    name: "Lying Triceps Extension (Skull Crusher)",
    category: "isolation",
    muscles: ["triceps"],
    equipment: ["barbell", "dumbbell"],
    difficulty: "beginner",
    setup: [
      "Lie flat on a bench holding an EZ-bar or barbell above chest with arms straight.",
      "Position hands about shoulder-width apart."
    ],
    instructions: [
      "Hinge at the elbows to lower the bar toward your forehead or slightly overhead.",
      "Press the bar back to the starting position by extending the elbows."
    ],
    execution: [
      "Keep upper arms locked in place, angled slightly backward (10-15 degrees) to maintain constant tension.",
      "Do not flare elbows outward."
    ],
    breathing: "Inhale while lowering the weight, exhale while extending and squeezing the triceps.",
    tempo: "3-0-1-0",
    commonMistakes: [
      "Allowing upper arms to sway forward and backward",
      "Flaring elbows wide to the sides",
      "Bouncing the bar off the forehead"
    ],
    safetyTips: [
      "Lower the bar under absolute control.",
      "Use an EZ-curl bar to significantly reduce wrist strain."
    ],
    progressionTips: [
      "Add reps first, then small plate additions.",
      "Angle the arms backward to keep tension at the top."
    ]
  },
  {
    id: "barbell-preacher-curl",
    name: "Barbell Preacher Curl",
    category: "isolation",
    muscles: ["biceps"],
    equipment: ["barbell", "machine"],
    difficulty: "beginner",
    setup: [
      "Sit at a preacher bench and rest the back of your upper arms flat against the pad.",
      "Grip the barbell or EZ-bar with an underhand grip, shoulder-width apart."
    ],
    instructions: [
      "Curl the bar upward toward your shoulders, keeping your upper arms glued to the pad.",
      "Lower the bar slowly until your arms are fully extended but not hyperextended."
    ],
    execution: [
      "Do not raise your butt off the seat to leverage the weight.",
      "Maintain a strong grip and neutral wrists throughout."
    ],
    breathing: "Exhale as you curl upward, inhale as you control the descent.",
    tempo: "3-0-1-0",
    commonMistakes: [
      "Hyperextending the elbows at the bottom of the rep",
      "Lifting upper arms off the preacher pad",
      "Using full body swinging momentum"
    ],
    safetyTips: [
      "Never load excessively; the preacher setup exposes the biceps tendon to high strain at the bottom.",
      "Stop just shy of absolute elbow lockout at the bottom."
    ],
    progressionTips: [
      "Focus on slow negatives (3-4 seconds) to stimulate muscle hypertrophy.",
      "Progress to EZ-bar for wrist safety."
    ]
  },
  {
    id: "barbell-good-morning",
    name: "Barbell Good Morning",
    category: "compound",
    muscles: ["hamstrings", "glutes", "back", "core"],
    equipment: ["barbell"],
    difficulty: "advanced",
    setup: [
      "Set the barbell at upper-chest height on a rack.",
      "Position the bar on your upper traps (high bar) or rear delts (low bar), unrack, and take two steps back."
    ],
    instructions: [
      "Soften knees slightly, brace core, and hinge at the hips to push your butt backward.",
      "Lower your torso until it is nearly parallel to the floor, then drive hips forward to stand."
    ],
    execution: [
      "Keep your back perfectly flat and spine neutral throughout.",
      "Maintain shin positions vertical; the movement is a hinge, not a squat."
    ],
    breathing: "Inhale and brace core deeply before hinging, exhale as you lock out hips.",
    tempo: "3-0-1-0",
    commonMistakes: [
      "Rounding the thoracic or lumbar spine",
      "Squatting the weight down by bending knees too much",
      "Going too fast on the descent"
    ],
    safetyTips: [
      "Start extremely light to master hip hinge coordination.",
      "Do not perform this exercise if you have active low back pain."
    ],
    progressionTips: [
      "Slowly increase loads when hip hinge mechanics are locked in.",
      "Excellent supplementary lift to build deadlift lockout power."
    ]
  },
  {
    id: "barbell-shrug",
    name: "Barbell Shrug",
    category: "isolation",
    muscles: ["back", "shoulders"],
    equipment: ["barbell"],
    difficulty: "beginner",
    setup: [
      "Stand tall holding a barbell in front of thighs with an overhand grip, hands shoulder-width.",
      "Keep shoulders relaxed and back straight."
    ],
    instructions: [
      "Elevate your shoulders straight up toward your ears as high as possible.",
      "Hold the peak contraction for 1 second, then lower back down slowly."
    ],
    execution: [
      "Avoid rolling your shoulders in a circle; lift straight up and down.",
      "Keep neck in a neutral, forward-looking position."
    ],
    breathing: "Exhale as you shrug up, inhale as you lower the barbell.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Rolling the shoulders (damages rotator cuff over time)",
      "Bending elbows to pull the weight up",
      "Craning the neck forward"
    ],
    safetyTips: [
      "Use lifting straps if your grip gives out before your traps are fatigued.",
      "Keep the path of the bar close to your body."
    ],
    progressionTips: [
      "Add progressive weight since the traps are highly resilient.",
      "Incorporate static holds at the top."
    ]
  },
  {
    id: "dumbbell-arnold-press",
    name: "Arnold Dumbbell Press",
    category: "compound",
    muscles: ["shoulders", "triceps"],
    equipment: ["dumbbell"],
    difficulty: "intermediate",
    setup: [
      "Sit on a bench with back support, holding dumbbells in front of your chest.",
      "Position palms facing your body (supinated), as if in the top of a bicep curl."
    ],
    instructions: [
      "Press the dumbbells overhead while rotating your wrists 180 degrees.",
      "At lockout, your palms should face forward. Lower and rotate back to start."
    ],
    execution: [
      "Ensure a smooth, continuous rotation throughout the pressing path.",
      "Avoid letting the dumbbells flare out too wide during rotation."
    ],
    breathing: "Exhale as you press and rotate, inhale as you return to starting position.",
    tempo: "2-1-2-0",
    commonMistakes: [
      "Rushing the rotation phase",
      "Arching the lower back excessively",
      "Locking out elbows aggressively"
    ],
    safetyTips: [
      "Use lighter weight than a standard shoulder press due to rotatory strain.",
      "Stop if any pinching sensation occurs in the shoulder joint."
    ],
    progressionTips: [
      "Fosters excellent anterior and lateral delt hypertrophy.",
      "Increase weight only when wrist rotation is fluid and balanced."
    ]
  },
  {
    id: "dumbbell-rear-delt-fly",
    name: "Dumbbell Rear Delt Fly",
    category: "isolation",
    muscles: ["shoulders", "back"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: [
      "Stand with feet hip-width, holding dumbbells. Hinge forward at the hips to a 45-degree angle.",
      "Let dumbbells hang with palms facing each other, maintaining a slight elbow bend."
    ],
    instructions: [
      "Raise arms out to the sides, squeezing your rear delts at the top.",
      "Control the weight back down to the starting position."
    ],
    execution: [
      "Focus on moving the weight with the back of the shoulder, not the lats.",
      "Keep your torso completely stationary."
    ],
    breathing: "Exhale while raising the dumbbells, inhale as they descend.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Using excessive body momentum (swinging)",
      "Squeezing shoulder blades completely (shifts load to traps/rhomboids)",
      "Tucking elbows to turn it into a row"
    ],
    safetyTips: [
      "Keep spine flat and head neutral; do not look up.",
      "Use light weights; rear delts are small muscles."
    ],
    progressionTips: [
      "Increase weekly volume or hold the peak contraction to trigger growth.",
      "Can also be performed chest-supported on an incline bench."
    ]
  },
  {
    id: "dumbbell-bulgarian-split-squat",
    name: "Dumbbell Bulgarian Split Squat",
    category: "compound",
    muscles: ["quads", "glutes", "hamstrings"],
    equipment: ["dumbbell", "bodyweight"],
    difficulty: "intermediate",
    setup: [
      "Stand about two feet in front of a flat bench.",
      "Reach one foot back and rest the top of your foot on the bench. Hold dumbbells at sides."
    ],
    instructions: [
      "Lower your hips until your rear knee is near the floor and front thigh is parallel.",
      "Drive through your front heel and midfoot to return to the standing position."
    ],
    execution: [
      "Lean torso slightly forward (15-20 degrees) to recruit more glutes, or stay upright for quads.",
      "Ensure front knee tracks inline with toes."
    ],
    breathing: "Inhale on the descent, exhale as you push back up to standing.",
    tempo: "3-1-1-0",
    commonMistakes: [
      "Front foot placed too close to the bench (causes knee pain)",
      "Rear leg doing too much of the pushing",
      "Losing balance or lateral alignment"
    ],
    safetyTips: [
      "Start with bodyweight to find your balance.",
      "Keep core braced to protect your low back."
    ],
    progressionTips: [
      "Add load slowly using dumbbells or a barbell.",
      "Use deficit setups (elevating front foot) to increase range of motion."
    ]
  },
  {
    id: "dumbbell-farmer-walk",
    name: "Dumbbell Farmer's Walk",
    category: "compound",
    muscles: ["core", "shoulders", "back", "full body"],
    equipment: ["dumbbell", "other"],
    difficulty: "beginner",
    setup: [
      "Stand between two heavy dumbbells.",
      "Squat down with flat back, grip the handles tightly, and stand up."
    ],
    instructions: [
      "Walk forward in short, controlled, heel-to-toe steps.",
      "Keep posture perfectly tall with shoulders retracted and core braced."
    ],
    execution: [
      "Do not look down at your feet; keep eyes straight ahead.",
      "Squeeze grip as tightly as possible to stabilize the load."
    ],
    breathing: "Take shallow, active breaths while keeping abdominal bracing tight.",
    tempo: "Slow, deliberate pace.",
    commonMistakes: [
      "Rounding the shoulders or upper back",
      "Walking too fast or rushing steps",
      "Letting the dumbbells bounce against legs"
    ],
    safetyTips: [
      "If you lose balance or grip, drop dumbbells cleanly to the sides.",
      "Keep path clear of obstacles."
    ],
    progressionTips: [
      "Progress by carrying heavier loads or walking longer distances.",
      "Superb for building grip strength, dynamic core stability, and traps."
    ]
  },
  {
    id: "dumbbell-incline-bicep-curl",
    name: "Incline Dumbbell Bicep Curl",
    category: "isolation",
    muscles: ["biceps"],
    equipment: ["dumbbell"],
    difficulty: "intermediate",
    setup: [
      "Set an adjustable bench to a 45-60 degree incline.",
      "Lie back with dumbbells hanging straight down, palms facing forward."
    ],
    instructions: [
      "Keeping elbows pinned behind your torso, curl dumbbells upward.",
      "Squeeze biceps at the top, then slowly lower to the starting position."
    ],
    execution: [
      "Keep upper arms vertical throughout; do not let elbows swing forward.",
      "Maintain full contact of your back against the bench."
    ],
    breathing: "Exhale as you curl up, inhale as you lower under control.",
    tempo: "3-0-1-0",
    commonMistakes: [
      "Letting elbows swing forward to chest level",
      "Using head or shoulder movement to cheat",
      "Failing to fully extend arms at the bottom"
    ],
    safetyTips: [
      "Control the bottom portion of the lift to avoid shoulder/bicep hyperextension.",
      "Use lighter weight than standing curls."
    ],
    progressionTips: [
      "Excellent for targeting the long head of the biceps brachii due to stretch.",
      "Add a 1-second pause at peak contraction."
    ]
  },
  {
    id: "dumbbell-pullover",
    name: "Dumbbell Pullover",
    category: "compound",
    muscles: ["chest", "back"],
    equipment: ["dumbbell"],
    difficulty: "intermediate",
    setup: [
      "Place upper back across a flat bench, hips off the bench and slightly lower.",
      "Hold one dumbbell with both hands in a diamond grip above chest, arms nearly straight."
    ],
    instructions: [
      "Lower the dumbbell backward in an arc behind your head until your upper arms are in line with your torso.",
      "Pull the dumbbell back up along the same path, stopping above your upper chest."
    ],
    execution: [
      "Keep elbows slightly bent but rigid throughout the range.",
      "Squeeze chest and lats to drive the movement."
    ],
    breathing: "Deep inhale on the way down to stretch thoracic area, exhale returning up.",
    tempo: "3-1-1-0",
    commonMistakes: [
      "Bending and straightening elbows (turns it into a tricep extension)",
      "Letting hips rise during the descent (cancels out the lat stretch)",
      "Going too fast or dropping the weight"
    ],
    safetyTips: [
      "Ensure a secure diamond grip on the dumbbell head.",
      "Avoid excessive shoulder stretch if you have history of instability."
    ],
    progressionTips: [
      "Works both pectoralis major and latissimus dorsi.",
      "Gradually increase loading as shoulder mobility permits."
    ]
  },
  {
    id: "dumbbell-concentration-curl",
    name: "Dumbbell Concentration Curl",
    category: "isolation",
    muscles: ["biceps"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: [
      "Sit on the edge of a flat bench with legs spread. Hold a dumbbell in one hand.",
      "Rest the back of your working elbow against the inside of your same-side thigh."
    ],
    instructions: [
      "Curl the dumbbell upward toward your face, contracting your bicep fully.",
      "Lower the weight slowly, extending the arm completely before starting the next rep."
    ],
    execution: [
      "Keep your upper body stable; only the forearm should move.",
      "Supinate the wrist (turn pinky finger up) at the top of the movement."
    ],
    breathing: "Exhale curling up, inhale lowering down.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Resting the elbow on top of the thigh (removes isolation)",
      "Swinging the torso or using leg support",
      "Partial range of motion"
    ],
    safetyTips: [
      "Perform with a weight that allows absolute control.",
      "Avoid forward head posture."
    ],
    progressionTips: [
      "This is a high-isolation lift. Focus on mind-muscle connection rather than high load."
    ]
  },
  {
    id: "dumbbell-chest-supported-row",
    name: "Chest-Supported Dumbbell Row",
    category: "compound",
    muscles: ["back", "biceps"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: [
      "Set an adjustable bench to a 30-45 degree incline.",
      "Lie face down on the bench with your chest supported. Dumbbells hang straight down."
    ],
    instructions: [
      "Row dumbbells up toward your hips, pulling elbows high and back.",
      "Lower dumbbells slowly to the starting position, stretching your lats."
    ],
    execution: [
      "Keep chest firmly pressed against the pad; do not arch off the bench.",
      "Lead the pull with your elbows, retracting shoulder blades."
    ],
    breathing: "Exhale rowing up, inhale lowering down.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Lifting chest off the pad at peak contraction",
      "Shrugging shoulders up toward ears",
      "Pulling dumbbells straight up to shoulders"
    ],
    safetyTips: [
      "Highly recommended for individuals with lower back pain as it unloads the spine.",
      "Ensure bench is stable before loading."
    ],
    progressionTips: [
      "Vary grip (pronated, neutral, or supinated) to hit different fibers of the back."
    ]
  },
  {
    id: "dumbbell-renegade-row",
    name: "Dumbbell Renegade Row",
    category: "compound",
    muscles: ["core", "back", "shoulders", "biceps"],
    equipment: ["dumbbell"],
    difficulty: "advanced",
    setup: [
      "Place two dumbbells on the floor, shoulder-width apart.",
      "Get into a push-up position holding the dumbbell handles, feet spread wide for stability."
    ],
    instructions: [
      "Shift weight to one side and row the opposite dumbbell to your hip.",
      "Lower it with control, then repeat on the other side."
    ],
    execution: [
      "Keep hips perfectly level; do not let them rotate as you row.",
      "Brace core and squeeze glutes to maintain a rigid plank."
    ],
    breathing: "Exhale while rowing, inhale as you lower the dumbbell.",
    tempo: "2-0-1-0",
    commonMistakes: [
      "Rotating the hips or torso excessively",
      "Hips sagging or shooting up",
      "Using dumbbells that roll easily"
    ],
    safetyTips: [
      "Use hex dumbbells to prevent rolling and wrist injuries.",
      "Start with light dumbbells to master stability."
    ],
    progressionTips: [
      "Add a push-up between row reps for an extra challenge."
    ]
  },
  {
    id: "dumbbell-step-up",
    name: "Dumbbell Step-Up",
    category: "compound",
    muscles: ["quads", "glutes", "hamstrings"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    setup: [
      "Stand tall holding dumbbells at your sides.",
      "Face a sturdy box or bench (knee-height)."
    ],
    instructions: [
      "Place your entire foot on the box, drive through that heel, and step up.",
      "Bring trailing foot to touch the box, then step down with control."
    ],
    execution: [
      "Avoid pushing off the floor with your trailing foot; let the lead leg do all the work.",
      "Keep knee tracking straight over your lead foot."
    ],
    breathing: "Exhale driving up, inhale stepping down with control.",
    tempo: "2-0-1-0",
    commonMistakes: [
      "Pushing off the floor with the trailing foot",
      "Using a box that is too high (hip flexing past 90 degrees)",
      "Letting the lead knee cave inward"
    ],
    safetyTips: [
      "Ensure box or bench is locked down and slip-resistant.",
      "Focus eyes forward for balance."
    ],
    progressionTips: [
      "Increase box height slightly or add weight to dumbbells."
    ]
  },
  {
    id: "seated-leg-curl",
    name: "Seated Leg Curl",
    category: "isolation",
    muscles: ["hamstrings"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: [
      "Sit in the machine with back flat against pad.",
      "Place lower legs on pad (just below calves) and secure thigh support pad snug against thighs."
    ],
    instructions: [
      "Pull the foot pad down and back toward your seat as far as possible.",
      "Pause for a split-second, then return to the starting position under control."
    ],
    execution: [
      "Maintain a tall posture; do not round your back.",
      "Dorsiflex ankles (pull toes toward shins) for optimal hamstring tension."
    ],
    breathing: "Exhale curling down, inhale returning to starting position.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Lifting thighs off the seat support",
      "Rushing the eccentric (return) phase",
      "Not extending legs fully at the top"
    ],
    safetyTips: [
      "Ensure thigh pad is secured tightly to prevent knee strain.",
      "Avoid jerky, explosive movements."
    ],
    progressionTips: [
      "Provides better peak hamstring contraction compared to lying leg curls."
    ]
  },
  {
    id: "chest-press-machine",
    name: "Chest Press Machine",
    category: "compound",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: [
      "Adjust seat height so handles align with mid-to-lower chest.",
      "Sit back firmly, retract shoulder blades, and grip handles."
    ],
    instructions: [
      "Press handles forward until arms are extended but not locked.",
      "Slowly return to the start position, feeling a deep chest stretch."
    ],
    execution: [
      "Keep shoulders pressed back against the pad throughout.",
      "Keep elbows slightly below shoulder height."
    ],
    breathing: "Exhale pressing forward, inhale on the return.",
    tempo: "2-0-1-0",
    commonMistakes: [
      "Letting shoulders shrug or round forward at the end of the press",
      "Wrists bending backward",
      "Partial range of motion"
    ],
    safetyTips: [
      "Use the foot assist lever (if available) to unrack safely.",
      "Adjust settings to prevent joint hyper-extension."
    ],
    progressionTips: [
      "Excellent machine for training near failure safely without a spotter."
    ]
  },
  {
    id: "pec-dec-fly",
    name: "Pec Dec Fly",
    category: "isolation",
    muscles: ["chest"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: [
      "Adjust seat so that hands/arms are parallel to the floor when gripping handles.",
      "Sit back, place forearms against pads (or grip handles with straight arms), chest up."
    ],
    instructions: [
      "Squeeze handles together in front of your chest under control.",
      "Pause, then slowly return to the open position until you feel a deep stretch."
    ],
    execution: [
      "Keep shoulder blades retracted and chest expanded throughout.",
      "Do not let the weight stack touch at the bottom of the rep."
    ],
    breathing: "Exhale as you fly inward, inhale as you open under control.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Rounding the shoulders forward to finish the rep",
      "Bending elbows excessively (turns it into a press)",
      "Using explosive momentum"
    ],
    safetyTips: [
      "Adjust the starting arms so they do not overstretch the shoulders.",
      "Stop if you experience anterior shoulder pain."
    ],
    progressionTips: [
      "Great for isolating the sternocostal head of the chest."
    ]
  },
  {
    id: "reverse-pec-dec",
    name: "Reverse Pec Dec",
    category: "isolation",
    muscles: ["shoulders", "back"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: [
      "Sit facing the machine pad. Adjust seat so handles are at shoulder height.",
      "Grip handles with pronated or neutral grip, keeping chest pressed against pad."
    ],
    instructions: [
      "Squeeze handles backward in a horizontal arc until arms are inline with shoulders.",
      "Hold peak contraction for a split-second, then return slowly to start."
    ],
    execution: [
      "Avoid shrugging shoulders up.",
      "Keep a micro-bend in elbows, but lock the angle throughout."
    ],
    breathing: "Exhale pulling back, inhale returning.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Shrugging and using upper traps",
      "Bending and straightening elbows",
      "Torso lifting off the chest pad"
    ],
    safetyTips: [
      "Ensure a controlled eccentric phase to prevent shoulder snapping."
    ],
    progressionTips: [
      "Highly effective for rear delt and middle trapezius development."
    ]
  },
  {
    id: "smith-machine-squat",
    name: "Smith Machine Squat",
    category: "compound",
    muscles: ["quads", "glutes", "hamstrings"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: [
      "Adjust bar to shoulder height. Step under and rest it on traps.",
      "Place feet slightly forward of the bar line, shoulder-width apart."
    ],
    instructions: [
      "Rotate the bar to unlock, squat down until thighs are parallel or below.",
      "Drive through midfoot to stand tall, rotating bar back to lock at finish."
    ],
    execution: [
      "Smith machine's fixed path allows placing feet forward to load quads deeply.",
      "Keep chest proud and back neutral."
    ],
    breathing: "Inhale down, exhale driving up.",
    tempo: "3-0-1-0",
    commonMistakes: [
      "Placing feet too far back (causes knee shearing)",
      "Locking knees aggressively at the top",
      "Losing torso brace"
    ],
    safetyTips: [
      "Always set the physical smith machine safety stops.",
      "Keep hands wrapped fully around the bar."
    ],
    progressionTips: [
      "Great for quad isolation since balance requirements are removed."
    ]
  },
  {
    id: "assisted-pull-up",
    name: "Assisted Pull-Up",
    category: "compound",
    muscles: ["back", "biceps", "core"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: [
      "Select desired counterweight on the stack. Step onto the platform.",
      "Place knees or feet on the pad and grip pull-up bars wide."
    ],
    instructions: [
      "Pull elbows to ribs to lift body until chin clears the bar.",
      "Lower under control back to a full dead hang."
    ],
    execution: [
      "Maintain active shoulders; do not shrug at bottom.",
      "Squeeze glutes and core to keep body from swaying."
    ],
    breathing: "Exhale as you pull up, inhale as you lower.",
    tempo: "2-0-1-0",
    commonMistakes: [
      "Bouncing off the bottom assistance pad",
      "Using partial range",
      "Letting shoulders roll forward at the top"
    ],
    safetyTips: [
      "Step off the pad carefully at the end of the set.",
      "Check assistance weight before climbing up."
    ],
    progressionTips: [
      "Gradually reduce the assistance weight as you get stronger."
    ]
  },
  {
    id: "assisted-dip",
    name: "Assisted Dip",
    category: "compound",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: [
      "Adjust counterweight. Place knees or feet on the assisted pad.",
      "Grip dip handles, support yourself with locked elbows."
    ],
    instructions: [
      "Lower your body by bending elbows until upper arms are parallel.",
      "Press back up using chest and triceps to starting position."
    ],
    execution: [
      "Lean forward slightly to recruit chest, or stay upright for triceps.",
      "Keep elbows tucked rather than flared."
    ],
    breathing: "Inhale lowering, exhale pressing up.",
    tempo: "3-0-1-0",
    commonMistakes: [
      "Going too deep (impinges shoulders)",
      "Flaring elbows too wide",
      "Bouncing at the bottom"
    ],
    safetyTips: [
      "Stop when shoulder discomfort occurs.",
      "Dismount with control."
    ],
    progressionTips: [
      "Step down in assistance weight until you can perform bodyweight dips."
    ]
  },
  {
    id: "machine-t-bar-row",
    name: "Machine T-Bar Row",
    category: "compound",
    muscles: ["back", "biceps"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: [
      "Step onto platform, rest chest against support pad.",
      "Reach down and grab handles (neutral or wide grip)."
    ],
    instructions: [
      "Pull handles toward chest, squeezing upper back and lats.",
      "Lower the load under control to starting stretch."
    ],
    execution: [
      "Keep chest pinned to pad; do not use hips.",
      "Drive elbows high."
    ],
    breathing: "Exhale pulling, inhale releasing.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Lifting chest off pad",
      "Rounding lower back",
      "Using leg drive"
    ],
    safetyTips: [
      "Keep core tight.",
      "Ensure grip is secure."
    ],
    progressionTips: [
      "Adjust foot placements to alter leverage."
    ]
  },
  {
    id: "hip-abductor-machine",
    name: "Hip Abductor Machine",
    category: "isolation",
    muscles: ["glutes"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: [
      "Sit in machine with pads resting against outer knees.",
      "Sit tall, grab handles at sides."
    ],
    instructions: [
      "Push thighs outward against resistance as far as possible.",
      "Hold brief pause, return slowly to center."
    ],
    execution: [
      "Move deliberately without swinging.",
      "Feel the contraction in gluteus medius."
    ],
    breathing: "Exhale pressing out, inhale returning.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Using explosive momentum",
      "Rounding lower back",
      "Weight stacks slamming"
    ],
    safetyTips: [
      "Keep movements fluid to protect hip joints."
    ],
    progressionTips: [
      "Try leaning forward slightly to target different glute fibers."
    ]
  },
  {
    id: "hip-adductor-machine",
    name: "Hip Adductor Machine",
    category: "isolation",
    muscles: ["glutes"],
    equipment: ["machine"],
    difficulty: "beginner",
    setup: [
      "Sit in machine with pads resting against inner knees.",
      "Set starting range comfortable for your groin."
    ],
    instructions: [
      "Squeeze thighs together until pads touch in center.",
      "Pause, return slowly to open stretch."
    ],
    execution: [
      "Control the eccentric stretching phase.",
      "Keep pelvis stable on seat."
    ],
    breathing: "Exhale squeezing in, inhale opening."
    ,
    tempo: "2-0-1-1",
    commonMistakes: [
      "Setting range too wide initially",
      "Bouncing off weight stack",
      "Lifting hips"
    ],
    safetyTips: [
      "Do not set starting range too wide; avoid groin strains."
    ],
    progressionTips: [
      "Excellent accessory for stabilizing knee alignment."
    ]
  },
  {
    id: "cable-overhead-extension",
    name: "Cable Overhead Tricep Extension",
    category: "isolation",
    muscles: ["triceps"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: [
      "Attach rope to low pulley. Stagger stance, face away from cable.",
      "Bring rope behind head, elbows pointing forward/up."
    ],
    instructions: [
      "Extend arms overhead, separating the rope at lockout.",
      "Lower rope back behind head under control."
    ],
    execution: [
      "Keep elbows pointing forward; do not let them flare wide.",
      "Keep core braced to avoid hyperextending lower back."
    ],
    breathing: "Exhale extending, inhale lowering.",
    tempo: "2-0-1-0",
    commonMistakes: [
      "Flaring elbows wide",
      "Arching lower back",
      "Partial range of motion"
    ],
    safetyTips: [
      "Warm up elbows thoroughly.",
      "Start with light weight."
    ],
    progressionTips: [
      "Excellent for isolating the long head of the triceps under stretch."
    ]
  },
  {
    id: "cable-bicep-curl",
    name: "Cable Bicep Curl",
    category: "isolation",
    muscles: ["biceps"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: [
      "Attach straight or EZ-bar to low pulley.",
      "Stand facing machine, grip bar underhand, arms extended."
    ],
    instructions: [
      "Curl bar upward to shoulders, keeping elbows pinned.",
      "Slowly lower under constant cable tension."
    ],
    execution: [
      "Keep wrists neutral.",
      "Do not swing torso."
    ],
    breathing: "Exhale curling, inhale lowering.",
    tempo: "2-0-1-0",
    commonMistakes: [
      "Swinging body to cheat",
      "Moving elbows forward"
    ],
    safetyTips: [
      "Control the eccentric phase completely."
    ],
    progressionTips: [
      "Provides constant tension across the entire range of motion."
    ]
  },
  {
    id: "cable-lateral-raise",
    name: "Cable Lateral Raise",
    category: "isolation",
    muscles: ["shoulders"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: [
      "Set cable to lowest setting. Stand sideways to machine.",
      "Reach across body to grab D-handle with outer hand."
    ],
    instructions: [
      "Raise arm out to the side until parallel to floor.",
      "Lower slowly, resisting the cable pull."
    ],
    execution: [
      "Lead with elbow.",
      "Keep a micro-bend in elbow."
    ],
    breathing: "Exhale raising, inhale lowering.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Shrugging with upper traps",
      "Bending elbow too much"
    ],
    safetyTips: [
      "Do not raise above shoulder height."
    ],
    progressionTips: [
      "Offers continuous tension at the bottom of the movement."
    ]
  },
  {
    id: "cable-woodchop",
    name: "Cable Woodchop",
    category: "isolation",
    muscles: ["core", "shoulders"],
    equipment: ["cable"],
    difficulty: "intermediate",
    setup: [
      "Set cable to high or low setting. Stand sideways, grip D-handle with both hands.",
      "Step away from stack, feet wide."
    ],
    instructions: [
      "Pull cable diagonally across body in a chopping motion.",
      "Rotate hips and pivot rear foot, then return under control."
    ],
    execution: [
      "Initiate twist from core, not arms.",
      "Keep arms mostly straight."
    ],
    breathing: "Exhale as you chop, inhale returning.",
    tempo: "2-0-1-0",
    commonMistakes: [
      "Using arms to pull instead of torso rotation",
      "Not pivoting back foot (strains knee)"
    ],
    safetyTips: [
      "Keep core highly braced throughout."
    ],
    progressionTips: [
      "Vary pull direction (high-to-low or low-to-high)."
    ]
  },
  {
    id: "cable-pull-through",
    name: "Cable Pull-Through",
    category: "compound",
    muscles: ["hamstrings", "glutes", "core"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: [
      "Attach rope to low pulley. Stand facing away from machine, rope between legs.",
      "Step forward, hinge at hips, letting rope pull hands back between thighs."
    ],
    instructions: [
      "Drive hips forward explosively to stand, squeezing glutes.",
      "Hinge hips back to lower, maintaining flat back."
    ],
    execution: [
      "Ensure arms remain straight; do not pull with arms.",
      "Weight remains on heels."
    ],
    breathing: "Inhale hinging back, exhale driving forward.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Squatting instead of hinging",
      "Pulling rope with arms"
    ],
    safetyTips: [
      "Keep spine neutral."
    ],
    progressionTips: [
      "Superb developer of posterior chain without loading spine."
    ]
  },
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    category: "isolation",
    muscles: ["core"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: [
      "Attach rope to high pulley. Kneel facing machine.",
      "Hold rope behind head, hands near ears. Hips remain elevated."
    ],
    instructions: [
      "Flex spine to crunch elbows toward knees.",
      "Slowly return to upright, stretching abs."
    ],
    execution: [
      "Do not pull with arms or sit down onto heels.",
      "Focus entirely on spinal flexion."
    ],
    breathing: "Exhale fully at bottom contraction, inhale returning up.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Sitting back onto heels (uses bodyweight instead of abs)",
      "Pulling with arms"
    ],
    safetyTips: [
      "Do not strain neck."
    ],
    progressionTips: [
      "Gradually increase resistance as abdominal strength grows."
    ]
  },
  {
    id: "cable-glute-kickback",
    name: "Cable Glute Kickback",
    category: "isolation",
    muscles: ["glutes", "hamstrings"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: [
      "Set cable to bottom. Attach ankle strap to working ankle.",
      "Face stack, hinge forward holding support rail, soft knees."
    ],
    instructions: [
      "Kick working leg back and up, squeezing glute at peak.",
      "Return leg forward under control."
    ],
    execution: [
      "Do not arch lower back to gain height.",
      "Keep movement isolated to hip."
    ],
    breathing: "Exhale kicking back, inhale returning.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Arching lower back",
      "Using swing momentum"
    ],
    safetyTips: [
      "Keep hips square."
    ],
    progressionTips: [
      "Vary kick angle (straight back vs diagonally out)."
    ]
  },
  {
    id: "cable-straight-arm-pulldown",
    name: "Cable Straight-Arm Pulldown",
    category: "isolation",
    muscles: ["back", "core"],
    equipment: ["cable"],
    difficulty: "beginner",
    setup: [
      "Attach straight bar or rope to high pulley. Face machine.",
      "Grip bar overhand, take two steps back, hinge slightly forward."
    ],
    instructions: [
      "Pull bar down in an arc to thighs, keeping arms straight.",
      "Slowly return to starting stretch."
    ],
    execution: [
      "Keep elbows locked with micro-bend.",
      "Squeeze lats at bottom."
    ],
    breathing: "Exhale pulling down, inhale returning.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Bending elbows (turns it into pushdowns)",
      "Rounding upper back"
    ],
    safetyTips: [
      "Keep spine flat."
    ],
    progressionTips: [
      "Great for isolating lats without bicep involvement."
    ]
  },
  {
    id: "bench-dip",
    name: "Bench Dip",
    category: "compound",
    muscles: ["triceps", "chest", "shoulders"],
    equipment: ["bodyweight", "other"],
    difficulty: "beginner",
    setup: [
      "Place hands on edge of bench, fingers forward.",
      "Extend legs forward, support weight on heels."
    ],
    instructions: [
      "Lower hips by bending elbows to 90 degrees.",
      "Press back up to lock out."
    ],
    execution: [
      "Keep back close to bench.",
      "Do not let shoulders roll forward."
    ],
    breathing: "Inhale down, exhale up.",
    tempo: "2-0-1-0",
    commonMistakes: [
      "Letting hips drift away from bench",
      "Shoulders shrugging"
    ],
    safetyTips: [
      "Avoid if shoulder impingement occurs."
    ],
    progressionTips: [
      "Elevate feet or add weight on thighs to progress."
    ]
  },
  {
    id: "pistol-squat",
    name: "Pistol Squat",
    category: "compound",
    muscles: ["quads", "glutes", "hamstrings", "core"],
    equipment: ["bodyweight"],
    difficulty: "advanced",
    setup: [
      "Stand tall on one leg, extending other leg straight forward.",
      "Extend arms forward for balance."
    ],
    instructions: [
      "Lower into a deep single-leg squat, keeping extended leg off floor.",
      "Drive through heel to return to standing."
    ],
    execution: [
      "Keep knee tracking straight.",
      "Maintain active brace."
    ],
    breathing: "Inhale down, exhale driving up.",
    tempo: "3-1-1-0",
    commonMistakes: [
      "Knee collapsing inward",
      "Heel of working foot lifting"
    ],
    safetyTips: [
      "Use support (e.g. pole, TRX) to learn."
    ],
    progressionTips: [
      "Superb for single-leg strength and ankle mobility."
    ]
  },
  {
    id: "side-plank",
    name: "Side Plank",
    category: "mobility",
    muscles: ["core"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: [
      "Lie on side, elbow directly under shoulder.",
      "Stack feet (or stagger)."
    ],
    instructions: [
      "Lift hips until body forms straight line.",
      "Hold position, breathing steadily."
    ],
    execution: [
      "Keep hips forward and high.",
      "Squeeze glutes."
    ],
    breathing: "Slow, rhythmic breathing.",
    tempo: "Isometric hold.",
    commonMistakes: [
      "Sagging hips",
      "Torso twisting forward"
    ],
    safetyTips: [
      "Ensure elbow alignment is stacked."
    ],
    progressionTips: [
      "Add leg raises or thread-the-needle transitions to progress."
    ]
  },
  {
    id: "ab-wheel-rollout",
    name: "Ab Wheel Rollout",
    category: "isolation",
    muscles: ["core"],
    equipment: ["other"],
    difficulty: "advanced",
    setup: [
      "Kneel on pad, grip ab wheel handles.",
      "Round upper back slightly, tuck pelvis (posterior tilt)."
    ],
    instructions: [
      "Roll wheel forward, extending body without arching back.",
      "Pull back to starting position using abs."
    ],
    execution: [
      "Do not let low back sag.",
      "Keep arms mostly straight."
    ],
    breathing: "Inhale rolling out, exhale pulling back.",
    tempo: "3-0-1-0",
    commonMistakes: [
      "Hyperextending lower back",
      "Pulling back with hips/arms instead of abs"
    ],
    safetyTips: [
      "Limit rollout depth initially."
    ],
    progressionTips: [
      "Progress to standing rollouts."
    ]
  },
  {
    id: "russian-twist",
    name: "Russian Twist",
    category: "isolation",
    muscles: ["core"],
    equipment: ["bodyweight", "dumbbell"],
    difficulty: "beginner",
    setup: [
      "Sit with knees bent, feet flat (or elevated for challenge).",
      "Lean back slightly (45 degrees), spine neutral."
    ],
    instructions: [
      "Rotate torso from side to side, touching hands to floor.",
      "Move with control."
    ],
    execution: [
      "Rotate from rib cage, not arms.",
      "Keep hips stable."
    ],
    breathing: "Breathe continuously."
    ,
    tempo: "Controlled alternating.",
    commonMistakes: [
      "Rounding spine",
      "Moving only the arms"
    ],
    safetyTips: [
      "Avoid if lumbar rotation is painful."
    ],
    progressionTips: [
      "Hold a dumbbell or plate to progress."
    ]
  },
  {
    id: "bicycle-crunch",
    name: "Bicycle Crunch",
    category: "isolation",
    muscles: ["core"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: [
      "Lie flat, hands behind head, legs in tabletop position.",
      "Lift shoulder blades off floor."
    ],
    instructions: [
      "Rotate torso, bringing opposite elbow to knee while extending other leg.",
      "Alternate sides in a cycling motion."
    ],
    execution: [
      "Focus on shoulder rotation rather than elbow pulling.",
      "Control the speed."
    ],
    breathing: "Exhale on twists, inhale transitioning.",
    tempo: "Slow controlled.",
    commonMistakes: [
      "Pulling on neck",
      "Rushing repetitions"
    ],
    safetyTips: [
      "Keep lower back flat against floor."
    ],
    progressionTips: [
      "Add a 2-second hold on each side."
    ]
  },
  {
    id: "superman",
    name: "Superman",
    category: "mobility",
    muscles: ["back", "glutes"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: [
      "Lie face down, arms extended overhead, legs straight."
    ],
    instructions: [
      "Lift arms, chest, and thighs off floor simultaneously.",
      "Hold peak briefly, lower slowly."
    ],
    execution: [
      "Keep neck neutral, looking down.",
      "Squeeze glutes and lower back."
    ],
    breathing: "Exhale lifting, inhale lowering.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Craning neck up",
      "Bending knees"
    ],
    safetyTips: [
      "Do not overarch."
    ],
    progressionTips: [
      "Incorporate alternating arm/leg raises."
    ]
  },
  {
    id: "kettlebell-turkish-get-up",
    name: "Turkish Get-Up",
    category: "compound",
    muscles: ["full body", "shoulders", "core"],
    equipment: ["kettlebell"],
    difficulty: "advanced",
    setup: [
      "Lie on side, fetal position, grip bell. Roll to back.",
      "Press bell up with working arm. Bend same-side leg."
    ],
    instructions: [
      "Roll to elbow, push to hand, lift hips, sweep opposite leg under to kneel.",
      "Hinge torso vertical, lunge to stand. Reverse steps to descend."
    ],
    execution: [
      "Keep eyes locked on kettlebell throughout.",
      "Maintain packed, active shoulder."
    ],
    breathing: "Control breathing at each step of the sequence.",
    tempo: "Slow, methodical transition.",
    commonMistakes: [
      "Losing eye contact with kettlebell",
      "Shrugging working shoulder",
      "Rushing transitions"
    ],
    safetyTips: [
      "Practice sequence without weight first.",
      "Perform on padded flooring."
    ],
    progressionTips: [
      "Builds unmatched shoulder stability, mobility, and core strength."
    ]
  },
  {
    id: "kettlebell-snatch",
    name: "Kettlebell Snatch",
    category: "compound",
    muscles: ["full body", "back", "shoulders"],
    equipment: ["kettlebell"],
    difficulty: "advanced",
    setup: [
      "Stand over bell. Hinge, grab bell, hike backward."
    ],
    instructions: [
      "Drive hips forward explosively, pulling bell upward.",
      "Punch hand through handle at top to lock out overhead without banging forearm."
    ],
    execution: [
      "Keep bell close to body (taming the arc).",
      "Lock out hips completely."
    ],
    breathing: "Sharp exhale at lockout, inhale on descent.",
    tempo: "Explosive.",
    commonMistakes: [
      "Letting kettlebell bang hard on forearm",
      "Using arm strength rather than hips"
    ],
    safetyTips: [
      "Master the kettlebell clean and swing first."
    ],
    progressionTips: [
      "Ultimate conditioning and power lift."
    ]
  },
  {
    id: "kettlebell-clean",
    name: "Kettlebell Clean",
    category: "compound",
    muscles: ["full body", "glutes", "biceps"],
    equipment: ["kettlebell"],
    difficulty: "intermediate",
    setup: [
      "Hinge, grip kettlebell handle loosely, hike back."
    ],
    instructions: [
      "Drive hips forward, pulling bell close.",
      "Guide kettlebell into the 'rack' position (hand near chest, elbow tucked)."
    ],
    execution: [
      "Avoid banging forearm; insert hand deep.",
      "Keep core braced."
    ],
    breathing: "Exhale on clean, inhale descending.",
    tempo: "Explosive hip drive.",
    commonMistakes: [
      "Kettlebell flipping over and bruising forearm",
      "Casting bell out too far"
    ],
    safetyTips: [
      "Keep grip relaxed."
    ],
    progressionTips: [
      "Essential skill for overhead pressing setups."
    ]
  },
  {
    id: "rowing-machine",
    name: "Rowing Machine (Ergometer)",
    category: "cardio",
    muscles: ["full body", "back", "quads", "core"],
    equipment: ["cardio"],
    difficulty: "beginner",
    setup: [
      "Secure feet in straps. Sit tall.",
      "Hold handle with straight arms, shins vertical (the catch)."
    ],
    instructions: [
      "Drive with legs first, then lean back slightly, and pull handle to sternum.",
      "Extend arms, hinge torso forward, bend knees to slide forward."
    ],
    execution: [
      "Power output ratio: 60% legs, 20% core, 20% arms.",
      "Maintain flat back."
    ],
    breathing: "Exhale on drive, inhale sliding forward.",
    tempo: "Fluid rhythm.",
    commonMistakes: [
      "Rowing with arms first",
      "Rounding lower back"
    ],
    safetyTips: [
      "Set damper level conservatively (3-5)."
    ],
    progressionTips: [
      "Excellent cardiorespiratory builder with zero joint impact."
    ]
  },
  {
    id: "jump-rope",
    name: "Jump Rope",
    category: "cardio",
    muscles: ["calves", "shoulders", "core"],
    equipment: ["cardio"],
    difficulty: "beginner",
    setup: [
      "Hold handles, rope behind heels.",
      "Elbows tucked close, hands slightly forward."
    ],
    instructions: [
      "Turn rope with wrists, jump 1-2 inches off floor as it passes.",
      "Land softly on balls of feet."
    ],
    execution: [
      "Keep jumps low.",
      "Maintain tall posture."
    ],
    breathing: "Steady, controlled breathing.",
    tempo: "Fast rhythmic.",
    commonMistakes: [
      "Jumping too high",
      "Using entire arms to spin rope"
    ],
    safetyTips: [
      "Perform on resilient surfaces."
    ],
    progressionTips: [
      "Progress to double-unders or footwork variations."
    ]
  },
  {
    id: "box-jump",
    name: "Box Jump",
    category: "cardio",
    muscles: ["quads", "glutes", "calves"],
    equipment: ["other"],
    difficulty: "intermediate",
    setup: [
      "Stand facing sturdy box (knee height).",
      "Stance shoulder-width."
    ],
    instructions: [
      "Hinge hips back, swing arms, drive up explosively to jump.",
      "Land softly in squat on box. Step down."
    ],
    execution: [
      "Land with quiet feet in balanced squat.",
      "Stand tall to complete extension."
    ],
    breathing: "Exhale on jump, inhale stepping down.",
    tempo: "Explosive jump, controlled reset.",
    commonMistakes: [
      "Jumping down (strains Achilles tendon)",
      "Landing in deep, knee-crunched squat"
    ],
    safetyTips: [
      "Always step down off the box."
    ],
    progressionTips: [
      "Focus on landing quality over box height."
    ]
  },
  {
    id: "world-greatest-stretch",
    name: "World's Greatest Stretch",
    category: "mobility",
    muscles: ["full body"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: [
      "Start in a tall push-up plank."
    ],
    instructions: [
      "Step one foot outside same-side hand into deep lunge.",
      "Rotate chest and raise inside hand to sky, then return and stretch hamstring."
    ],
    execution: [
      "Keep back knee active.",
      "Follow hand with eyes."
    ],
    breathing: "Exhale on rotations and stretches.",
    tempo: "Slow, fluid mobility flow.",
    commonMistakes: [
      "Rushing through steps",
      "Letting hips sag painfully"
    ],
    safetyTips: [
      "Move within comfortable ranges."
    ],
    progressionTips: [
      "The definitive full-body warm-up movement."
    ]
  },
  {
    id: "pigeon-pose",
    name: "Pigeon Pose Stretch",
    category: "mobility",
    muscles: ["glutes"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: [
      "From hands and knees, bring one knee forward behind same-side wrist.",
      "Position shin diagonally."
    ],
    instructions: [
      "Slide opposite leg straight back, hips square to floor.",
      "Lower torso down over front leg, holding stretch."
    ],
    execution: [
      "Keep front foot flexed to protect knee.",
      "Keep hips square."
    ],
    breathing: "Deep, slow nasal breathing."
    ,
    tempo: "Static hold.",
    commonMistakes: [
      "Rolling onto side of hip",
      "Forcing knee into painful angle"
    ],
    safetyTips: [
      "Support hip with block/towel if tight."
    ],
    progressionTips: [
      "Increases hip external rotation."
    ]
  },
  {
    id: "band-pull-apart",
    name: "Band Pull-Apart",
    category: "isolation",
    muscles: ["shoulders", "back"],
    equipment: ["band"],
    difficulty: "beginner",
    setup: [
      "Stand holding resistance band shoulder-width, arms extended forward."
    ],
    instructions: [
      "Pull hands out to sides, stretching band until it touches chest.",
      "Return under control to start."
    ],
    execution: [
      "Keep shoulders depressed.",
      "Squeeze shoulder blades."
    ],
    breathing: "Exhale pulling apart, inhale returning.",
    tempo: "2-0-1-1",
    commonMistakes: [
      "Shrugging up",
      "Arching lower back"
    ],
    safetyTips: [
      "Inspect band for cracks before use."
    ],
    progressionTips: [
      "Excellent warm-up or recovery tool for shoulders."
    ]
  },
  {
    id: "banded-lateral-walk",
    name: "Banded Lateral Walk",
    category: "isolation",
    muscles: ["glutes"],
    equipment: ["band"],
    difficulty: "beginner",
    setup: [
      "Place loop band around ankles or above knees.",
      "Enter half-squat stance, feet hip-width."
    ],
    instructions: [
      "Take small lateral steps, maintaining band tension.",
      "Step in same direction, then reverse."
    ],
    execution: [
      "Keep toes pointed forward.",
      "Do not let knees cave inward."
    ],
    breathing: "Breathe rhythmically.",
    tempo: "Controlled stepping.",
    commonMistakes: [
      "Knees caving in",
      "Dragging trailing foot"
    ],
    safetyTips: [
      "Maintain upright torso."
    ],
    progressionTips: [
      "Superb gluteus medius activator."
    ]
  },
  // ═══════════════════════════════════════════════════════════════
  // STEADY-STATE CARDIO MACHINES
  // ═══════════════════════════════════════════════════════════════
  {
    id: "treadmill-walk-incline",
    name: "Treadmill Incline Walk",
    category: "steady-state",
    muscles: ["quads", "glutes", "calves", "hamstrings"],
    equipment: ["treadmill"],
    difficulty: "beginner",
    setup: [
      "Set treadmill incline to 8-15%.",
      "Set speed to 2.5-3.5 mph."
    ],
    instructions: [
      "Walk at a brisk pace maintaining upright posture.",
      "Avoid holding handrails — swing arms naturally for full engagement."
    ],
    execution: [
      "Drive through full foot, heel to toe.",
      "Keep core braced and shoulders back."
    ],
    breathing: "Breathe naturally through the nose; exhale through mouth if needed.",
    tempo: "Steady sustained pace.",
    commonMistakes: [
      "Holding handrails, which reduces calorie burn by 20-25%",
      "Leaning forward excessively",
      "Setting incline too high too soon"
    ],
    safetyTips: [
      "Clip the safety key to your clothing.",
      "Start at lower incline and build up."
    ],
    progressionTips: [
      "Increase incline by 1% each week.",
      "The '12-3-30' protocol: 12% incline, 3.0 mph, 30 minutes — popularized for fat loss."
    ]
  },
  {
    id: "treadmill-jog",
    name: "Treadmill Jog",
    category: "steady-state",
    muscles: ["quads", "hamstrings", "calves", "glutes", "core"],
    equipment: ["treadmill"],
    difficulty: "beginner",
    setup: [
      "Set treadmill to 0-2% incline (1% simulates outdoor air resistance).",
      "Set speed to 4.5-6.0 mph."
    ],
    instructions: [
      "Maintain a relaxed, upright running posture.",
      "Land midfoot, not on heels, to reduce joint impact."
    ],
    execution: [
      "Keep cadence around 160-170 steps per minute.",
      "Arms at 90° angle, hands relaxed."
    ],
    breathing: "Rhythmic breathing: inhale for 2-3 strides, exhale for 2-3 strides.",
    tempo: "Conversational pace — you should be able to hold a sentence.",
    commonMistakes: [
      "Overstriding (landing ahead of center of mass)",
      "Clenching fists and tensing shoulders",
      "Starting too fast"
    ],
    safetyTips: [
      "Attach safety clip before starting.",
      "Wear proper running shoes with adequate cushioning."
    ],
    progressionTips: [
      "Add 5-10% more time per week (not speed).",
      "Build a base of 30 minutes before increasing intensity."
    ]
  },
  {
    id: "treadmill-run",
    name: "Treadmill Run",
    category: "steady-state",
    muscles: ["quads", "hamstrings", "calves", "glutes", "core"],
    equipment: ["treadmill"],
    difficulty: "intermediate",
    setup: [
      "Set treadmill to 1% incline.",
      "Set speed to 6.0-8.5 mph based on fitness level."
    ],
    instructions: [
      "Maintain tall posture with slight forward lean from ankles.",
      "Drive knees forward and push off with each stride."
    ],
    execution: [
      "Aim for 170-180 cadence.",
      "Keep core engaged, avoid trunk rotation."
    ],
    breathing: "Deep diaphragmatic breathing. Match breath to stride rhythm.",
    tempo: "Tempo run pace — challenging but sustainable for 20-40 min.",
    commonMistakes: [
      "Bouncing too high vertically (wasted energy)",
      "Looking down at feet instead of forward",
      "Gripping handrails"
    ],
    safetyTips: [
      "Always use the safety clip.",
      "Hydrate before and during long runs."
    ],
    progressionTips: [
      "Incorporate tempo runs: 10 min easy → 20 min at threshold → 5 min cool down.",
      "Increase weekly mileage by no more than 10%."
    ]
  },
  {
    id: "treadmill-sprint-intervals",
    name: "Treadmill Sprint Intervals",
    category: "cardio",
    muscles: ["quads", "hamstrings", "calves", "glutes", "core"],
    equipment: ["treadmill"],
    difficulty: "advanced",
    setup: [
      "Set incline to 0-1%.",
      "Identify your sprint speed (typically 9-12+ mph) and recovery speed (3-4 mph)."
    ],
    instructions: [
      "Sprint at max effort for 20-30 seconds.",
      "Recover with walking pace for 60-90 seconds. Repeat 8-12 rounds."
    ],
    execution: [
      "Powerful arm drive during sprints.",
      "Transition speed smoothly — use the belt controls."
    ],
    breathing: "Explosive breathing during sprints; recover with deep, slow breaths.",
    tempo: "20-30s sprint / 60-90s recovery intervals.",
    commonMistakes: [
      "Not warming up sufficiently before sprints",
      "Making recovery periods too short",
      "Sprinting on high incline (injury risk)"
    ],
    safetyTips: [
      "Always attach safety key for sprint work.",
      "Warm up 5-10 minutes with easy jogging first.",
      "Straddle the belt when changing to sprint speed."
    ],
    progressionTips: [
      "Start with 6 intervals and add 1-2 per week.",
      "Decrease rest periods as conditioning improves."
    ]
  },
  {
    id: "treadmill-12-3-30",
    name: "Treadmill 12-3-30 Protocol",
    category: "cardio",
    muscles: ["quads", "glutes", "calves", "hamstrings"],
    equipment: ["treadmill"],
    difficulty: "beginner",
    setup: [
      "Set treadmill incline to 12%.",
      "Set speed to 3.0 mph."
    ],
    instructions: [
      "Walk for 30 minutes maintaining the exact settings.",
      "Do not hold the handrails — arms swing naturally."
    ],
    execution: [
      "Stay upright; do not lean into the incline.",
      "Full heel-to-toe foot strike on each step."
    ],
    breathing: "Steady nasal breathing. Exhale through mouth if heart rate climbs.",
    tempo: "Sustained 30-minute walk at fixed settings.",
    commonMistakes: [
      "Holding onto the handrails (significantly reduces effectiveness)",
      "Leaning forward into the incline",
      "Starting at 12% without building up"
    ],
    safetyTips: [
      "If new to incline walking, start at 6-8% and build to 12% over 2 weeks.",
      "Wear proper footwear with arch support."
    ],
    progressionTips: [
      "Once comfortable, increase to 13-15% or add light hand weights.",
      "Popular viral protocol proven effective for Zone 2 fat oxidation."
    ]
  },
  {
    id: "stationary-bike-moderate",
    name: "Stationary Bike (Moderate)",
    category: "steady-state",
    muscles: ["quads", "hamstrings", "calves", "glutes"],
    equipment: ["stationary-bike"],
    difficulty: "beginner",
    setup: [
      "Adjust seat height so leg has slight bend (25-30°) at bottom of pedal stroke.",
      "Set resistance to moderate (RPE 4-5)."
    ],
    instructions: [
      "Pedal at a consistent 70-90 RPM cadence.",
      "Maintain upright posture with light grip on handlebars."
    ],
    execution: [
      "Push through the ball of the foot, pull up through the pedal stroke.",
      "Keep knees tracking over toes, not flaring outward."
    ],
    breathing: "Steady rhythmic breathing matching pedal cadence.",
    tempo: "Sustained moderate effort for 20-45 minutes.",
    commonMistakes: [
      "Seat too low (excessive knee flexion)",
      "Seat too high (rocking hips)",
      "Gripping handlebars too tightly"
    ],
    safetyTips: [
      "Proper seat height prevents knee pain.",
      "Stay hydrated during longer sessions."
    ],
    progressionTips: [
      "Increase resistance by 1 level each week.",
      "Excellent low-impact option for active recovery days."
    ]
  },
  {
    id: "stationary-bike-high-intensity",
    name: "Stationary Bike Intervals",
    category: "cardio",
    muscles: ["quads", "hamstrings", "calves", "glutes"],
    equipment: ["stationary-bike"],
    difficulty: "intermediate",
    setup: [
      "Adjust seat height appropriately.",
      "Identify high resistance (RPE 8-9) and recovery resistance (RPE 3-4)."
    ],
    instructions: [
      "Alternate 30-60 seconds of high-resistance sprinting with 60-90 seconds of easy pedaling.",
      "Complete 8-15 intervals."
    ],
    execution: [
      "During sprints, drive through full pedal stroke at 90-110+ RPM.",
      "During recovery, reduce RPM to 60-70."
    ],
    breathing: "Explosive breathing during sprints. Deep recovery breaths between.",
    tempo: "30-60s work / 60-90s rest intervals.",
    commonMistakes: [
      "Not enough resistance during sprints (spinning too fast with no load)",
      "Recovery periods too short",
      "Poor posture — hunching over handlebars"
    ],
    safetyTips: [
      "Warm up 5 minutes at low resistance before intervals.",
      "Cool down 5 minutes after final interval."
    ],
    progressionTips: [
      "Increase sprint duration or decrease recovery time as fitness improves.",
      "Proven superior to steady-state for VO2max improvement."
    ]
  },
  {
    id: "recumbent-bike",
    name: "Recumbent Bike",
    category: "steady-state",
    muscles: ["quads", "hamstrings", "glutes"],
    equipment: ["stationary-bike"],
    difficulty: "beginner",
    setup: [
      "Adjust seat so leg has slight bend at bottom of stroke.",
      "Lean back into the seat support."
    ],
    instructions: [
      "Pedal at a comfortable 60-80 RPM at moderate resistance.",
      "Maintain contact with the backrest throughout."
    ],
    execution: [
      "Push through heels for greater glute activation.",
      "Keep shoulders relaxed against the backrest."
    ],
    breathing: "Relaxed, natural breathing pattern.",
    tempo: "Steady moderate pace for 20-40 minutes.",
    commonMistakes: [
      "Setting resistance too low (minimal benefit)",
      "Leaning forward off the backrest"
    ],
    safetyTips: [
      "Excellent for those with back pain or limited mobility.",
      "Very low injury risk."
    ],
    progressionTips: [
      "Best low-impact option for recovery or beginners.",
      "Gradually increase resistance and duration."
    ]
  },
  {
    id: "elliptical-trainer",
    name: "Elliptical Trainer",
    category: "steady-state",
    muscles: ["quads", "hamstrings", "glutes", "core", "shoulders"],
    equipment: ["elliptical"],
    difficulty: "beginner",
    setup: [
      "Step onto pedals and grip the moving handles.",
      "Set resistance to moderate (RPE 4-5)."
    ],
    instructions: [
      "Move in a smooth, continuous elliptical stride.",
      "Use both the handles and pedals for full-body engagement."
    ],
    execution: [
      "Keep weight distributed evenly across both feet.",
      "Drive with legs while actively pushing and pulling handles."
    ],
    breathing: "Steady rhythmic breathing. Exhale on exertion phases.",
    tempo: "Sustained moderate effort for 20-40 minutes.",
    commonMistakes: [
      "Leaning too far forward on the handles",
      "Using only legs (not engaging upper body)",
      "Setting resistance too low"
    ],
    safetyTips: [
      "Zero impact — excellent for joint-sensitive individuals.",
      "Step on and off carefully while pedals are stationary."
    ],
    progressionTips: [
      "Increase resistance and/or incline progressively.",
      "Try reverse pedaling for hamstring/glute emphasis."
    ]
  },
  {
    id: "elliptical-hiit",
    name: "Elliptical HIIT",
    category: "cardio",
    muscles: ["quads", "hamstrings", "glutes", "core", "shoulders"],
    equipment: ["elliptical"],
    difficulty: "intermediate",
    setup: [
      "Set elliptical to a manageable base resistance.",
      "Identify sprint resistance (RPE 8-9) and recovery level (RPE 3-4)."
    ],
    instructions: [
      "Sprint at high resistance and fast stride rate for 30-45 seconds.",
      "Recover at slow pace and low resistance for 60-90 seconds. Repeat 10-15 rounds."
    ],
    execution: [
      "Maximum stride rate during sprint phases.",
      "Active recovery — keep moving, don't stop."
    ],
    breathing: "Explosive during sprints, deep recovery breaths between.",
    tempo: "30-45s work / 60-90s recovery.",
    commonMistakes: [
      "Recovery periods too intense (not actually recovering)",
      "Skipping warm-up",
      "Gripping handles too tightly during sprints"
    ],
    safetyTips: [
      "Warm up 5 minutes before starting intervals.",
      "Low-impact nature makes this safer than treadmill sprints for heavier individuals."
    ],
    progressionTips: [
      "Increase sprint duration or resistance level as conditioning improves."
    ]
  },
  {
    id: "stairclimber",
    name: "Stair Climber (StairMaster)",
    category: "steady-state",
    muscles: ["quads", "glutes", "calves", "hamstrings", "core"],
    equipment: ["stairclimber"],
    difficulty: "intermediate",
    setup: [
      "Step onto the pedals and grip the side rails lightly for balance only.",
      "Set speed to level 4-7 to start."
    ],
    instructions: [
      "Step up in a controlled, rhythmic motion.",
      "Drive through the full foot on each step — don't just tap toes."
    ],
    execution: [
      "Stand upright; do not lean on the rails.",
      "Take full steps — don't shuffle on the top portion of the pedal range."
    ],
    breathing: "Deep, steady breathing. Nasal inhale, mouth exhale.",
    tempo: "Sustained moderate climb for 15-30 minutes.",
    commonMistakes: [
      "Leaning heavily on handrails (negates most of the workout)",
      "Taking shallow, quick steps instead of full range steps",
      "Hunching forward"
    ],
    safetyTips: [
      "Start at lower speed and increase after 2-3 minutes.",
      "Use rails for balance only, not support."
    ],
    progressionTips: [
      "Increase speed by 1 level every 1-2 weeks.",
      "One of the highest calorie-burning cardio machines per minute."
    ]
  },
  {
    id: "stairclimber-intervals",
    name: "Stair Climber Intervals",
    category: "cardio",
    muscles: ["quads", "glutes", "calves", "hamstrings", "core"],
    equipment: ["stairclimber"],
    difficulty: "advanced",
    setup: [
      "Step onto the StairMaster and familiarize with speed controls.",
      "Identify fast speed (level 8-12) and recovery speed (level 3-5)."
    ],
    instructions: [
      "Climb at fast speed for 30-60 seconds.",
      "Reduce to recovery speed for 60-90 seconds. Repeat 8-12 rounds."
    ],
    execution: [
      "Drive through glutes during fast phases.",
      "Maintain upright posture throughout — no rail leaning."
    ],
    breathing: "Explosive on fast phases, deep recovery breaths between intervals.",
    tempo: "30-60s fast / 60-90s recovery.",
    commonMistakes: [
      "Leaning on rails during high-speed phases",
      "Recovery too short",
      "Not warming up first"
    ],
    safetyTips: [
      "Warm up with 3-5 minutes at moderate speed.",
      "Step off carefully — the machine keeps moving."
    ],
    progressionTips: [
      "Extremely demanding — excellent for leg endurance and VO2max."
    ]
  },
  {
    id: "assault-bike",
    name: "Assault Bike (Air Bike)",
    category: "cardio",
    muscles: ["quads", "hamstrings", "glutes", "core", "shoulders", "biceps", "triceps"],
    equipment: ["stationary-bike"],
    difficulty: "advanced",
    setup: [
      "Adjust seat height for slight knee bend at bottom of pedal stroke.",
      "Grip the handles firmly."
    ],
    instructions: [
      "Pedal and push/pull handles simultaneously for maximum output.",
      "For intervals: 20-30 seconds max effort, 60-90 seconds recovery."
    ],
    execution: [
      "Drive with legs and arms simultaneously.",
      "Keep core braced — the fan resistance increases with speed."
    ],
    breathing: "Explosive during work intervals. Deep recovery breaths between.",
    tempo: "Short max-effort bursts (20-30s) with longer recovery.",
    commonMistakes: [
      "Using only legs or only arms (use both)",
      "Going max effort without warm-up",
      "Recovery too short between intervals"
    ],
    safetyTips: [
      "This is extremely demanding — start with 4-6 intervals and build.",
      "Cool down with 3-5 minutes easy pedaling."
    ],
    progressionTips: [
      "The 'hardest cardio machine in the gym.' Air resistance is self-regulating.",
      "CrossFit staple — excellent for metabolic conditioning."
    ]
  },
  {
    id: "rowing-machine-hiit",
    name: "Rowing Machine HIIT",
    category: "cardio",
    muscles: ["back", "quads", "hamstrings", "glutes", "core", "shoulders", "biceps"],
    equipment: ["cardio"],
    difficulty: "intermediate",
    setup: [
      "Strap feet into the foot plates securely.",
      "Set damper to 4-6 for most people."
    ],
    instructions: [
      "Row at max effort for 250-500m, then rest 60-90 seconds.",
      "Repeat for 6-10 intervals. Focus on stroke rate 28-34 spm during work."
    ],
    execution: [
      "Sequence: legs → lean back → pull arms → reverse.",
      "Drive through legs first, then engage back and arms."
    ],
    breathing: "Exhale on the drive, inhale on the recovery.",
    tempo: "250-500m sprint / 60-90s rest.",
    commonMistakes: [
      "Pulling with arms first instead of legs",
      "Hunching back during the drive phase",
      "Setting damper too high (10 is not harder, just heavier)"
    ],
    safetyTips: [
      "Warm up with 500-1000m easy rowing.",
      "Maintain neutral spine throughout."
    ],
    progressionTips: [
      "Track 500m split time as your benchmark.",
      "Full-body cardio with excellent posterior chain engagement."
    ]
  },
  {
    id: "ski-erg",
    name: "Ski Erg",
    category: "steady-state",
    muscles: ["back", "shoulders", "triceps", "core", "glutes"],
    equipment: ["cardio"],
    difficulty: "intermediate",
    setup: [
      "Stand facing the machine and grab both handles.",
      "Feet hip-width apart, slight knee bend."
    ],
    instructions: [
      "Pull handles down in a smooth arc from overhead to hips.",
      "Hinge slightly at the hips with each pull, then return to standing."
    ],
    execution: [
      "Initiate pull with the lats and core, not just arms.",
      "Full extension overhead between pulls."
    ],
    breathing: "Exhale on the pull, inhale on the return.",
    tempo: "Rhythmic, sustained effort for 10-30 minutes.",
    commonMistakes: [
      "Using only arms (should be full body hinge)",
      "Not bending knees enough during the pull",
      "Too fast — sacrifice form for speed"
    ],
    safetyTips: [
      "Gentle on joints — no impact.",
      "Great upper-body complement to rowing."
    ],
    progressionTips: [
      "Track calories or distance per interval as benchmarks.",
      "Pairs excellently with rowing for full-body conditioning circuits."
    ]
  },
  {
    id: "battle-ropes",
    name: "Battle Ropes",
    category: "cardio",
    muscles: ["shoulders", "core", "biceps", "triceps", "back"],
    equipment: ["other"],
    difficulty: "intermediate",
    setup: [
      "Anchor ropes to a sturdy base at floor level.",
      "Stand with feet shoulder-width, slight squat, gripping one rope end per hand."
    ],
    instructions: [
      "Alternate arms creating continuous waves in the rope (alternating waves).",
      "For double waves, slam both ropes simultaneously."
    ],
    execution: [
      "Generate waves from the shoulders, not just the wrists.",
      "Maintain athletic stance with braced core throughout."
    ],
    breathing: "Rhythmic explosive breaths. Don't hold your breath.",
    tempo: "30s work / 30s rest for 8-12 rounds.",
    commonMistakes: [
      "Standing too upright (should be in athletic quarter-squat)",
      "Making waves too small — use full range of motion",
      "Holding breath during exertion"
    ],
    safetyTips: [
      "Ensure anchor point is secure before starting.",
      "Wear gloves if ropes cause skin irritation."
    ],
    progressionTips: [
      "Increase work intervals from 30s to 45s to 60s.",
      "Try different patterns: slams, circles, snakes."
    ]
  },
  {
    id: "sled-push",
    name: "Sled Push",
    category: "cardio",
    muscles: ["quads", "glutes", "calves", "hamstrings", "core", "shoulders"],
    equipment: ["other"],
    difficulty: "advanced",
    setup: [
      "Load sled with appropriate weight.",
      "Position hands on the high or low handles."
    ],
    instructions: [
      "Drive the sled forward with powerful leg strides.",
      "Push for 20-40 meters, rest, and repeat."
    ],
    execution: [
      "Lean into the sled at ~45° angle.",
      "Drive knees high with each stride. Full foot contact."
    ],
    breathing: "Exhale forcefully with each driving step.",
    tempo: "20-40m pushes with 60-90s rest between sets.",
    commonMistakes: [
      "Taking short, shuffling steps instead of full strides",
      "Loading too heavy and losing speed",
      "Arms too bent — should be near-straight for power transfer"
    ],
    safetyTips: [
      "Start with bodyweight on the sled and add load progressively.",
      "Ensure pushing surface is flat and clear."
    ],
    progressionTips: [
      "Excellent for GPP (General Physical Preparedness).",
      "Zero eccentric load — causes minimal DOMS."
    ]
  },
  {
    id: "jumping-jacks",
    name: "Jumping Jacks",
    category: "cardio",
    muscles: ["full body"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: [
      "Stand with feet together, arms at your sides."
    ],
    instructions: [
      "Jump feet out wide while raising arms overhead.",
      "Jump feet back together while lowering arms. Repeat rapidly."
    ],
    execution: [
      "Land softly on the balls of your feet.",
      "Full arm extension overhead with each rep."
    ],
    breathing: "Rhythmic breathing matching the jumping cadence.",
    tempo: "Rapid, continuous repetitions for 30-60 seconds.",
    commonMistakes: [
      "Landing flat-footed (increases joint stress)",
      "Partial arm movements",
      "Not maintaining rhythm"
    ],
    safetyTips: [
      "Perform on a cushioned surface if possible.",
      "Low-impact modification: step out instead of jump."
    ],
    progressionTips: [
      "Classic warm-up and cardio exercise.",
      "Increase speed or add ankle weights for progression."
    ]
  },
  {
    id: "high-knees",
    name: "High Knees",
    category: "cardio",
    muscles: ["quads", "core", "calves", "hamstrings"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: [
      "Stand with feet hip-width apart, arms bent at 90°."
    ],
    instructions: [
      "Drive one knee to hip height while pumping opposite arm.",
      "Alternate rapidly, landing on the balls of your feet."
    ],
    execution: [
      "Keep torso upright — don't lean back.",
      "Drive knees to waist height minimum."
    ],
    breathing: "Short, rhythmic breaths synced to knee drives.",
    tempo: "Rapid alternating for 20-45 seconds per set.",
    commonMistakes: [
      "Knees not reaching hip height",
      "Leaning backward",
      "Landing on heels"
    ],
    safetyTips: [
      "Excellent warm-up movement to elevate heart rate.",
      "Scale by reducing speed if knee issues present."
    ],
    progressionTips: [
      "Increase speed and duration as conditioning improves.",
      "Effective for sprint preparation and hip flexor activation."
    ]
  },
  {
    id: "butt-kicks",
    name: "Butt Kicks",
    category: "cardio",
    muscles: ["hamstrings", "calves", "quads"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: [
      "Stand with feet hip-width apart."
    ],
    instructions: [
      "Jog in place, kicking heels up toward glutes with each stride.",
      "Alternate rapidly while pumping arms naturally."
    ],
    execution: [
      "Heel should make contact or come very close to glutes.",
      "Stay on balls of feet throughout."
    ],
    breathing: "Quick, rhythmic breaths matching the kick cadence.",
    tempo: "Rapid alternating for 20-45 seconds per set.",
    commonMistakes: [
      "Heels not reaching high enough",
      "Leaning too far forward",
      "Flat-footed landing"
    ],
    safetyTips: [
      "Low-impact warm-up exercise.",
      "Great for hamstring activation pre-run."
    ],
    progressionTips: [
      "Pair with high knees for a complete running drill warm-up."
    ]
  },
  {
    id: "bear-crawl",
    name: "Bear Crawl",
    category: "cardio",
    muscles: ["core", "shoulders", "quads", "glutes"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    setup: [
      "Start on all fours — hands under shoulders, knees under hips.",
      "Lift knees 1-2 inches off the ground."
    ],
    instructions: [
      "Crawl forward by moving opposite hand and foot simultaneously.",
      "Keep back flat and hips low throughout."
    ],
    execution: [
      "Small, controlled steps — don't rush.",
      "Core braced, back parallel to the floor."
    ],
    breathing: "Steady controlled breathing. Don't hold breath.",
    tempo: "Slow, controlled crawling for distance or time.",
    commonMistakes: [
      "Hips rising too high (pike position)",
      "Steps too large (loses stability)",
      "Holding breath"
    ],
    safetyTips: [
      "Ensure clear path before starting.",
      "Wrists can fatigue — build up duration gradually."
    ],
    progressionTips: [
      "Add distance or weighted vest for progression.",
      "Excellent full-body conditioning with zero equipment."
    ]
  },
  {
    id: "swimming-freestyle",
    name: "Swimming (Freestyle)",
    category: "steady-state",
    muscles: ["back", "shoulders", "core", "triceps", "quads"],
    equipment: ["other"],
    difficulty: "intermediate",
    setup: [
      "Enter pool and push off the wall in streamline position.",
      "Body horizontal, face in water."
    ],
    instructions: [
      "Alternate arm strokes with a continuous flutter kick.",
      "Rotate body side-to-side with each stroke for efficient movement."
    ],
    execution: [
      "Reach forward fully before pulling through the water.",
      "Keep hips high — don't let legs drag."
    ],
    breathing: "Turn head to breathe every 2-3 strokes. Exhale underwater.",
    tempo: "Steady laps for 20-45 minutes or interval sets.",
    commonMistakes: [
      "Head too high (creates drag and drops legs)",
      "Crossing arms over midline during strokes",
      "Kicking from the knees instead of hips"
    ],
    safetyTips: [
      "Never swim alone.",
      "Start with shorter distances and build endurance."
    ],
    progressionTips: [
      "Zero joint impact — best option for injury recovery or high-volume cardio.",
      "Full-body workout engaging every major muscle group."
    ]
  },
  {
    id: "outdoor-running",
    name: "Outdoor Running",
    category: "steady-state",
    muscles: ["quads", "hamstrings", "calves", "glutes", "core"],
    equipment: ["other"],
    difficulty: "beginner",
    setup: [
      "Wear proper running shoes suited to your gait.",
      "Plan your route and check weather conditions."
    ],
    instructions: [
      "Run at a conversational pace for the planned distance or time.",
      "Maintain upright posture with relaxed shoulders."
    ],
    execution: [
      "Land midfoot under your center of gravity.",
      "Arms at 90°, hands relaxed, short compact arm swing."
    ],
    breathing: "Nasal inhale, mouth exhale. Match breath to stride rhythm.",
    tempo: "Easy conversational pace for 20-60 minutes.",
    commonMistakes: [
      "Starting too fast (go out at conversation pace)",
      "Overstriding — shorter, quicker steps are more efficient",
      "Ignoring hydration on runs over 30 minutes"
    ],
    safetyTips: [
      "Run against traffic if no sidewalk.",
      "Wear visible clothing in low light.",
      "Carry ID and phone."
    ],
    progressionTips: [
      "Follow the 10% rule — increase weekly mileage by no more than 10%.",
      "Vary terrain for greater conditioning."
    ]
  },
  {
    id: "walking-recovery-liss",
    name: "Walking (Recovery LISS)",
    category: "steady-state",
    muscles: ["quads", "hamstrings", "calves", "glutes"],
    equipment: ["other"],
    difficulty: "beginner",
    setup: [
      "Wear comfortable walking shoes.",
      "Plan a route or use a treadmill at 0-3% incline, 2.5-3.5 mph."
    ],
    instructions: [
      "Walk at a brisk but comfortable pace for 20-45 minutes.",
      "Swing arms naturally. Maintain upright posture."
    ],
    execution: [
      "Heel-to-toe foot strike.",
      "Keep shoulders relaxed and core lightly engaged."
    ],
    breathing: "Natural, relaxed nasal breathing.",
    tempo: "Sustained easy effort — Zone 1-2 heart rate.",
    commonMistakes: [
      "Walking too slowly (should be brisk, purposeful pace)",
      "Looking at phone (posture collapses)",
      "Wearing inappropriate footwear"
    ],
    safetyTips: [
      "Ideal for rest days and active recovery.",
      "Zero equipment needed — can be done anywhere."
    ],
    progressionTips: [
      "LISS (Low-Intensity Steady State) is proven for fat oxidation and recovery.",
      "Add incline or light hand weights for progression."
    ]
  },
  {
    id: "spin-bike-intervals",
    name: "Spin Bike Intervals",
    category: "cardio",
    muscles: ["quads", "hamstrings", "calves", "glutes", "core"],
    equipment: ["stationary-bike"],
    difficulty: "advanced",
    setup: [
      "Adjust seat and handlebar height for proper bike fit.",
      "Clip in or secure feet on pedals."
    ],
    instructions: [
      "Follow interval protocol: 40s seated climb at high resistance, 20s standing sprint.",
      "Repeat for 20-30 minutes with varied intensity blocks."
    ],
    execution: [
      "During seated climbs, maintain 60-70 RPM with heavy resistance.",
      "During standing sprints, 90-100+ RPM with moderate resistance."
    ],
    breathing: "Match breathing to effort level. Deep recovery breaths between blocks.",
    tempo: "Varied interval blocks over 20-45 minute session.",
    commonMistakes: [
      "Bouncing in the saddle (resistance too low)",
      "Hands too far forward on handlebars during climbs",
      "Not enough resistance for standing work (knee strain risk)"
    ],
    safetyTips: [
      "Proper bike fit is critical to prevent knee injury.",
      "Bring water — high sweat rate expected."
    ],
    progressionTips: [
      "Track average watts or calories for progressive overload.",
      "Popular class format — can be done solo with a structured protocol."
    ]
  },
  {
    id: "clean-and-jerk",
    name: "Barbell Clean and Jerk",
    category: "compound",
    muscles: ["full body", "shoulders", "quads", "glutes", "core"],
    equipment: ["barbell"],
    difficulty: "advanced",
    setup: [
      "Approach the bar with a conventional deadlift setup.",
      "Grip slightly wider than shoulder-width, lats pulled tight."
    ],
    instructions: [
      "Pull the bar explosively, catch in a front squat, and stand up (Clean).",
      "Dip knees slightly, then drive the bar overhead while splitting legs (Jerk)."
    ],
    execution: [
      "Keep bar close during the triple extension.",
      "Assertively lock out elbows overhead in the jerk.",
      "Recover feet together before dropping the bar."
    ],
    breathing: "Brace before pulling, exhale after catching the Clean, reset, brace, and exhale on the Jerk lockout.",
    tempo: "Explosive pull and powerful overhead drive.",
    commonMistakes: [
      "Catching with soft elbows in the jerk",
      "Letting the bar drift forward"
    ],
    safetyTips: [
      "Always use bumper plates on a lifting platform.",
      "Know how to bail the bar safely in front and behind."
    ],
    progressionTips: [
      "Build technical speed before advancing weight.",
      "Great for power, coordination, and athletic performance."
    ],
    aliases: ["clean and jerk", "clean & jerk", "olympic clean", "power clean"]
  },
  {
    id: "barbell-snatch",
    name: "Barbell Snatch",
    category: "compound",
    muscles: ["full body", "back", "shoulders", "hamstrings", "glutes"],
    equipment: ["barbell"],
    difficulty: "advanced",
    setup: [
      "Set feet hip-width. Use a very wide grip (inside collar-to-collar).",
      "Pull shoulder blades back and drop hips low."
    ],
    instructions: [
      "Pull the bar explosively from the floor.",
      "Extend hips fully, pull yourself under, and catch the bar overhead in a squat."
    ],
    execution: [
      "Ensure rapid under-bar pull speed.",
      "Active shoulders locking out the barbell overhead.",
      "Stand up fully to complete the lift."
    ],
    breathing: "Deep inhale and brace, pull with speed, exhale at lockout.",
    tempo: "Maximum explosive velocity.",
    commonMistakes: [
      "Bending arms too early",
      "Soft shoulders at catch"
    ],
    safetyTips: [
      "Lift on a dedicated platform.",
      "Ensure space behind you to throw the bar if bailing."
    ],
    progressionTips: [
      "Master overhead squat mobility first.",
      "Focus on aggressive bar path control."
    ],
    aliases: ["snatch", "olympic snatch", "power snatch", "barbell snatch"]
  },
  {
    id: "kettlebell-swing",
    name: "Kettlebell Swing",
    category: "compound",
    muscles: ["glutes", "hamstrings", "back", "core"],
    equipment: ["kettlebell"],
    difficulty: "intermediate",
    setup: [
      "Place kettlebell a foot in front of you.",
      "Hinge at the hips, grasp handle with both hands, and tilt bell back."
    ],
    instructions: [
      "Hike the kettlebell back between your thighs.",
      "Snap hips forward explosively, swinging the bell up to chest height."
    ],
    execution: [
      "This is a hip hinge, not a squat.",
      "Root feet into the floor and brace core at the top.",
      "Let the bell fall naturally, hinging only when it approaches hips."
    ],
    breathing: "Exhale sharply at hip extension snap, inhale on the descent.",
    tempo: "Dynamic explosive hinge cycle.",
    commonMistakes: [
      "Squatting the bell up",
      "Using arms to pull the weight"
    ],
    safetyTips: [
      "Maintain a flat neutral spine.",
      "Keep chest open and shoulders packed."
    ],
    progressionTips: [
      "Progress to one-arm swings once two-arm swing is stable.",
      "Add 4-8 kg when hip drive feels effortless."
    ],
    aliases: ["kb swing", "kettlebell swing", "swings"]
  },
  {
    id: "muscle-up",
    name: "Bar Muscle-Up",
    category: "compound",
    muscles: ["back", "chest", "triceps", "biceps", "core"],
    equipment: ["bodyweight"],
    difficulty: "advanced",
    setup: [
      "Hang from a pull-up bar with a false grip or active overhand grip.",
      "Create a slight hollow body shape for hollow-to-arch swing."
    ],
    instructions: [
      "Pull yourself up and around the bar using a dynamic chest pull.",
      "Transition shoulders forward over the bar, then dip up to lockout."
    ],
    execution: [
      "Pull chest to the bar with speed.",
      "Aggressively lean forward during transition.",
      "Press fully to straight arms at the top."
    ],
    breathing: "Exhale through the pull and transition, inhale at the top lockout.",
    tempo: "Fast explosive transition and dip.",
    commonMistakes: [
      "Transitioning one arm at a time (chicken winging)",
      "Lack of vertical chest pull height"
    ],
    safetyTips: [
      "Ensure bar is secure.",
      "Warm up shoulders thoroughly."
    ],
    progressionTips: [
      "Master high pull-ups and straight bar dips first.",
      "Use resistance bands to learn the transition path."
    ],
    aliases: ["muscle up", "muscleup", "bar muscle up", "calisthenics muscle up"]
  },
  {
    id: "ab-wheel-rollout",
    name: "Ab Wheel Rollout",
    category: "mobility",
    muscles: ["core", "back", "shoulders"],
    equipment: ["other"],
    difficulty: "intermediate",
    setup: [
      "Kneel on a soft pad holding the ab roller handles.",
      "Stack shoulders over wrists and tuck tailbone (posterior tilt)."
    ],
    instructions: [
      "Roll the wheel forward under control, keeping hips and torso locked.",
      "Pull yourself back to the starting kneeling position using your core."
    ],
    execution: [
      "Maintain a slight hollow rounded back.",
      "Avoid letting the low back sag or arch.",
      "Roll out only as far as you can maintain low back position."
    ],
    breathing: "Inhale rolling out, brace, and exhale as you roll back.",
    tempo: "Slow controlled eccentric, strong concentric.",
    commonMistakes: [
      "Hyperextending the lumbar spine",
      "Pulling back with hips first instead of core"
    ],
    safetyTips: [
      "Regress by rolling toward a wall to limit range.",
      "Stop immediately if low back discomfort is felt."
    ],
    progressionTips: [
      "Increase rollout distance.",
      "Progress to standing rollouts for advanced overload."
    ],
    aliases: ["ab roller", "ab wheel", "ab rollout", "core rollout"]
  }
];

export function getExerciseById(id: string): Exercise | undefined {
  const normId = id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return exercises.find((exercise) => {
    const exerciseNormId = exercise.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const hasAliasMatch = exercise.aliases?.some(
      alias => alias.trim().toLowerCase() === id.trim().toLowerCase()
    );
    return (
      exercise.id === id ||
      exerciseNormId === normId ||
      exercise.name.trim().toLowerCase() === id.trim().toLowerCase() ||
      hasAliasMatch
    );
  });
}
