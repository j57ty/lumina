import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type Q = { prompt: string; choices: string[]; answerIndex: number; explanation: string };
type L = { title: string; summary: string; minutes: number; content: string; questions: Q[] };
type U = { title: string; description: string; lessons: L[] };
type C = {
  slug: string; title: string; subject: string; description: string;
  gradeBand: string; color: string; icon: string; units: U[];
};

function lesson(title: string, summary: string, minutes: number, content: string, questions: Q[]): L {
  return { title, summary, minutes, content, questions };
}

const courses: C[] = [
  {
    slug: "algebra-1", title: "Algebra I", subject: "Mathematics",
    description: "Linear equations, inequalities, functions, and systems — the language the rest of high school math speaks.",
    gradeBand: "Grades 8–10", color: "#7C9CFF", icon: "∑",
    units: [
      {
        title: "Linear equations", description: "Solve and interpret equations in one variable.",
        lessons: [
          lesson("What an equation actually says", "Balance, inverse operations, and why both sides must stay equal.", 16,
`## The idea
An equation is a balanced scale. Whatever you do to one side, you do to the other.

## Worked example
Solve 3x + 7 = 22.
1. Subtract 7 from both sides: 3x = 15
2. Divide both sides by 3: x = 5
3. Check: 3(5)+7=22. True.

## Common traps
- Forgetting to apply an operation to every term.
- Mixing up “subtract 7” with “divide by 7”.`,
            [
              { prompt: "Solve 2x + 5 = 17. What is x?", choices: ["4", "6", "11", "12"], answerIndex: 1, explanation: "Subtract 5: 2x = 12. Divide by 2: x = 6." },
              { prompt: "Which move keeps an equation balanced?", choices: ["Add 3 to the left side only", "Divide only the constant term by 2", "Subtract 4 from both sides", "Move a term without changing its sign"], answerIndex: 2, explanation: "The same operation must be applied to both sides." },
            ]),
          lesson("Inequalities and number lines", "Graph solutions and remember when to flip the inequality sign.", 15,
`## The flip rule
When you multiply or divide both sides by a negative number, flip the inequality.

## Example
-2x < 8
Divide by -2 and flip: x > -4.

## Why
Multiplying by a negative reverses order on the number line: 3 < 5, but -3 > -5.`,
            [{ prompt: "Solve -3x ≥ 12.", choices: ["x ≥ -4", "x ≤ -4", "x ≥ 4", "x ≤ 4"], answerIndex: 1, explanation: "Divide by -3 and flip: x ≤ -4." }]),
        ],
      },
      {
        title: "Functions", description: "Inputs, outputs, and slope.",
        lessons: [
          lesson("Slope as a rate of change", "Rise over run, and what slope means in a word problem.", 18,
`## Definition
Slope m = (y2 - y1) / (x2 - x1).

## Meaning
If a tank drains 12 liters every 4 minutes, slope is -3 liters per minute.

## Slope-intercept
y = mx + b: m is slope, b is the y-intercept.`,
            [{ prompt: "A line through (1, 2) and (3, 8) has slope…", choices: ["2", "3", "4", "6"], answerIndex: 1, explanation: "(8-2)/(3-1) = 6/2 = 3." }]),
        ],
      },
    ],
  },
  {
    slug: "geometry", title: "Geometry", subject: "Mathematics",
    description: "Proof, congruence, similarity, circles, and right-triangle trigonometry.",
    gradeBand: "Grades 9–11", color: "#5EEAD4", icon: "△",
    units: [{
      title: "Triangles", description: "Congruence shortcuts and Pythagorean relationships.",
      lessons: [
        lesson("SSS, SAS, ASA, AAS", "The four reliable ways to prove two triangles congruent.", 20,
`## Congruence
Same shape and same size. Corresponding sides and angles match.

## Shortcuts that work
SSS, SAS, ASA, AAS.

## Does not work
SSA is not a congruence theorem (the ambiguous case). AAA proves similarity, not congruence.`,
          [{ prompt: "Which condition does NOT prove congruence?", choices: ["SAS", "AAS", "SSA", "SSS"], answerIndex: 2, explanation: "SSA is the ambiguous case." }]),
        lesson("Pythagorean theorem in context", "a² + b² = c², and when a triangle is acute or obtuse.", 16,
`## The theorem
In a right triangle, a² + b² = c² where c is the hypotenuse.

## Classify a triangle by sides
Compare a²+b² to c²: equal → right; greater → acute; smaller → obtuse.`,
          [{ prompt: "Legs 5 and 12. Hypotenuse?", choices: ["13", "14", "15", "17"], answerIndex: 0, explanation: "25 + 144 = 169 = 13²." }]),
      ],
    }],
  },
  {
    slug: "algebra-2", title: "Algebra II", subject: "Mathematics",
    description: "Quadratics, polynomials, exponentials, logs, and rational functions.",
    gradeBand: "Grades 10–12", color: "#A78BFA", icon: "ƒ",
    units: [{
      title: "Quadratics", description: "Factor, complete the square, quadratic formula.",
      lessons: [lesson("The quadratic formula without fear", "Where the formula comes from and how to use the discriminant.", 22,
`## Formula
For ax² + bx + c = 0,
x = (-b ± √(b²-4ac)) / (2a)

## Discriminant D = b²-4ac
D>0 two real roots; D=0 one real root; D<0 no real roots.`,
        [{ prompt: "Discriminant of x² + 4x + 5?", choices: ["-4", "0", "4", "36"], answerIndex: 0, explanation: "16 - 20 = -4." }])],
    }],
  },
  {
    slug: "precalculus", title: "Precalculus", subject: "Mathematics",
    description: "Functions, trigonometry, vectors, and limits as a runway into calculus.",
    gradeBand: "Grades 11–12", color: "#F472B6", icon: "θ",
    units: [{
      title: "Trigonometry", description: "Unit circle and identities.",
      lessons: [lesson("The unit circle, memorized with meaning", "Sine is y, cosine is x, and the special angles.", 20,
`## Coordinates
A point at angle θ on the unit circle is (cos θ, sin θ).

## Special angles
0: (1,0) · π/6: (√3/2, 1/2) · π/4: (√2/2, √2/2) · π/3: (1/2, √3/2) · π/2: (0,1)

## Signs
ASTC — all / sine / tangent / cosine positive by quadrant.`,
        [{ prompt: "cos(π/3) equals…", choices: ["0", "1/2", "√2/2", "√3/2"], answerIndex: 1, explanation: "π/3 is 60°, cosine is 1/2." }])],
    }],
  },
  {
    slug: "statistics", title: "Statistics", subject: "Mathematics",
    description: "Data, distributions, probability, and how not to get fooled by a graph.",
    gradeBand: "Grades 10–12", color: "#34D399", icon: "σ",
    units: [{
      title: "Describing data", description: "Center, spread, and shape.",
      lessons: [lesson("Mean, median, and when each lies to you", "Outliers pull the mean; the median resists them.", 14,
`## Mean
Average. Sensitive to outliers.

## Median
Middle value. Better for skewed data such as income.

## Example
70, 72, 75, 78, 200. Mean = 99. Median = 75.`,
        [{ prompt: "Which measure is more resistant to outliers?", choices: ["Mean", "Median", "Range", "Sum"], answerIndex: 1, explanation: "The median only cares about order." }])],
    }],
  },
  {
    slug: "biology", title: "Biology", subject: "Science",
    description: "Cells, genetics, evolution, ecology, and human body systems.",
    gradeBand: "Grades 9–11", color: "#4ADE80", icon: "🧬",
    units: [
      {
        title: "Cells", description: "Structure and membranes.",
        lessons: [
          lesson("Prokaryotes vs eukaryotes", "Nucleus or not, and why that split matters.", 17,
`## Prokaryotes
No nucleus. Bacteria and archaea.

## Eukaryotes
Nucleus plus organelles. Animals, plants, fungi, protists.

## Shared
Ribosomes, cytoplasm, plasma membrane, DNA.`,
            [{ prompt: "Which is true of prokaryotes?", choices: ["They always have mitochondria", "They lack a true nucleus", "They are only multicellular", "They never have cell walls"], answerIndex: 1, explanation: "No membrane-bound nucleus." }]),
          lesson("Photosynthesis in one page", "Light reactions and the Calvin cycle, without the fog.", 18,
`## Overall
6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂

## Light reactions (thylakoid)
Water is split, oxygen is released, ATP and NADPH are made.

## Calvin cycle (stroma)
CO₂ is fixed into sugar using that ATP and NADPH.`,
            [{ prompt: "Oxygen released by plants comes mainly from…", choices: ["Carbon dioxide", "Glucose", "Water", "ATP"], answerIndex: 2, explanation: "Photolysis of water." }]),
        ],
      },
      {
        title: "Genetics", description: "Mendel, DNA, and protein synthesis.",
        lessons: [lesson("DNA to protein", "Transcription and translation as a two-step pipeline.", 20,
`## Central dogma
DNA → RNA → protein.

## Transcription
In the nucleus, RNA polymerase copies a gene into mRNA.

## Translation
At the ribosome, tRNA reads codons and assembles amino acids.`,
          [{ prompt: "Where does translation happen in a eukaryotic cell?", choices: ["Nucleus", "Ribosome", "Golgi only", "Lysosome"], answerIndex: 1, explanation: "Ribosomes build polypeptides." }])],
      },
    ],
  },
  {
    slug: "chemistry", title: "Chemistry", subject: "Science",
    description: "Atoms, bonding, reactions, stoichiometry, and acids & bases.",
    gradeBand: "Grades 10–12", color: "#FBBF24", icon: "⚗",
    units: [
      {
        title: "Stoichiometry", description: "The accounting system of chemistry.",
        lessons: [lesson("Moles are just a counting unit", "6.022×10²³ of anything, and why chemists need it.", 16,
`## Avogadro’s number
One mole = 6.022 × 10²³ particles.

## Bridge
grams ⇄ moles ⇄ particles ⇄ 22.4 L of gas at STP.`,
          [{ prompt: "How many moles are in 36 g of H₂O? (M = 18 g/mol)", choices: ["0.5", "1", "2", "18"], answerIndex: 2, explanation: "36 / 18 = 2 moles." }])],
      },
      {
        title: "Bonding", description: "Ionic, covalent, and polarity.",
        lessons: [lesson("Why oil and water refuse to mix", "Polarity, hydrogen bonding, and like dissolves like.", 15,
`## Polar molecules
Uneven electron sharing. Water is bent, so dipoles do not cancel.

## Like dissolves like
Polar solvents dissolve polar solutes. Oil is nonpolar; water is polar.`,
          [{ prompt: "Water is a good solvent for salt mainly because water is…", choices: ["Nonpolar", "Polar", "Metallic", "Radioactive"], answerIndex: 1, explanation: "Polar water stabilizes ions." }])],
      },
    ],
  },
  {
    slug: "physics", title: "Physics", subject: "Science",
    description: "Motion, forces, energy, waves, electricity, and a first look at modern physics.",
    gradeBand: "Grades 11–12", color: "#60A5FA", icon: "⚡",
    units: [{
      title: "Newtonian mechanics", description: "Forces and motion.",
      lessons: [
        lesson("Newton’s three laws as actual tools", "Inertia, F = ma, and action-reaction pairs.", 18,
`## First law
An object keeps its velocity unless a net force acts.

## Second law
F_net = ma.

## Third law
Forces come in pairs on different objects.`,
          [{ prompt: "A 4 kg object has net force 12 N. Acceleration?", choices: ["3 m/s²", "8 m/s²", "16 m/s²", "48 m/s²"], answerIndex: 0, explanation: "a = F/m = 12/4 = 3." }]),
        lesson("Energy is the bookkeeper of motion", "Kinetic, potential, and conservation.", 17,
`## Kinetic
K = ½mv²

## Gravitational potential (near Earth)
U = mgh

## Conservation
If only conservative forces do work, mechanical energy stays constant.`,
          [{ prompt: "Double the speed of a car. Kinetic energy…", choices: ["stays the same", "doubles", "triples", "quadruples"], answerIndex: 3, explanation: "K depends on v²." }]),
      ],
    }],
  },
  {
    slug: "earth-science", title: "Earth & Space Science", subject: "Science",
    description: "Plate tectonics, weather, climate, and the solar system.",
    gradeBand: "Grades 9–12", color: "#2DD4BF", icon: "🌍",
    units: [{
      title: "The planet’s engine", description: "Interior heat and surface change.",
      lessons: [lesson("Plate tectonics in four boundaries", "Divergent, convergent, transform, and the hazards each creates.", 16,
`## Divergent — plates pull apart. Ridges, rift valleys.
## Convergent — collide. Trenches, arcs, mountains.
## Transform — slide. Earthquakes, little volcanism.`,
        [{ prompt: "The Himalayas formed mainly from…", choices: ["A transform fault", "Seafloor spreading", "Continent-continent collision", "A meteor impact last year"], answerIndex: 2, explanation: "India collided with Eurasia." }])],
    }],
  },
  {
    slug: "english-composition", title: "English Language & Composition", subject: "English",
    description: "Argument, rhetoric, grammar that actually helps your writing, and source-based essays.",
    gradeBand: "Grades 9–12", color: "#F8B4D9", icon: "✎",
    units: [{
      title: "Argument", description: "Claims, evidence, warrants.",
      lessons: [lesson("A thesis is a debatable claim", "If nobody could disagree, it is not a thesis.", 14,
`## Weak
“Shakespeare wrote many plays.” (fact)

## Strong
“Macbeth argues that ambition without a moral limit destroys both the self and the state.”

## Test
Can a reasonable person disagree? Then you have a claim.`,
        [{ prompt: "Which is the strongest thesis?", choices: ["This essay is about climate.", "Climate change exists.", "High schools should start later because adolescent sleep cycles make early bells inequitable.", "I will discuss several topics."], answerIndex: 2, explanation: "Specific, debatable, and reasoned." }])],
    }],
  },
  {
    slug: "world-literature", title: "World Literature", subject: "English",
    description: "How stories travel: myth, novel, drama, and poetry across cultures.",
    gradeBand: "Grades 9–12", color: "#FDA4AF", icon: "📖",
    units: [{
      title: "Reading closely", description: "Theme, motif, and narrator.",
      lessons: [lesson("Theme is not a topic", "A topic is ‘power’. A theme is a complete idea about power.", 15,
`## Topic vs theme
Topic: betrayal.
Theme: “Betrayal in this novel is less a single act than a habit characters learn from their institutions.”`,
        [{ prompt: "Which statement is a theme rather than a topic?", choices: ["Love", "War", "Friendship", "Loyalty without judgment can make people complicit."], answerIndex: 3, explanation: "A theme is a full claim." }])],
    }],
  },
  {
    slug: "world-history", title: "World History", subject: "Social Studies",
    description: "From early civilizations through globalization, with causes and consequences — not just dates.",
    gradeBand: "Grades 9–12", color: "#F59E0B", icon: "🏛",
    units: [{
      title: "Revolutions", description: "Political and industrial rupture.",
      lessons: [lesson("Why the Industrial Revolution started in Britain", "Coal, colonies, capital, and political conditions — not magic.", 18,
`## Cause cluster
Accessible coal and iron, ports, agricultural surplus, commercial capital (including profits of empire), relatively stable property rights.

## Effects
Urbanization, class conflict, global inequality, later labor reform. Not only “progress.”`,
        [{ prompt: "Which factor helped Britain industrialize early?", choices: ["A complete lack of colonies", "No coal reserves", "Accessible coal plus commercial capital", "The invention of the internet"], answerIndex: 2, explanation: "Energy + capital + markets." }])],
    }],
  },
  {
    slug: "us-history", title: "U.S. History", subject: "Social Studies",
    description: "Colonization through the present, with documents, arguments, and contested memory.",
    gradeBand: "Grades 10–12", color: "#FB7185", icon: "🦅",
    units: [{
      title: "Founding and fracture", description: "Constitution to Civil War.",
      lessons: [lesson("The Constitution as a bundle of compromises", "Representation, slavery, and federal power were bargained, not revealed.", 20,
`## Great Compromise
Senate equal by state, House by population.

## Three-Fifths Compromise
Enslaved people counted as three-fifths for representation and taxation.

## Federalism
Power split between national and state governments.`,
        [{ prompt: "The Great Compromise created…", choices: ["A unicameral legislature", "A two-house Congress", "The Supreme Court alone", "Abolition of slavery"], answerIndex: 1, explanation: "Senate + House." }])],
    }],
  },
  {
    slug: "government", title: "Government & Civics", subject: "Social Studies",
    description: "How the U.S. system is supposed to work, how it actually works, and how to participate.",
    gradeBand: "Grades 11–12", color: "#818CF8", icon: "⚖",
    units: [{
      title: "Institutions", description: "Three branches and the glue between them.",
      lessons: [lesson("Checks and balances are not decorations", "Each branch can stall the others. That is the design.", 16,
`## Examples
Congress passes laws; the president can veto; Congress can override.
The president nominates judges; the Senate confirms.
Courts can strike down laws.

## Split vs tools
Separation of powers is the split. Checks and balances are the tools.`,
        [{ prompt: "Which is a check the Senate has on the president?", choices: ["Declaring laws unconstitutional", "Confirming nominations", "Commanding the military directly", "Printing money by itself"], answerIndex: 1, explanation: "Advice and consent." }])],
    }],
  },
  {
    slug: "economics", title: "Economics", subject: "Social Studies",
    description: "Scarcity, markets, incentives, and the basics of national economies.",
    gradeBand: "Grades 11–12", color: "#C084FC", icon: "📈",
    units: [{
      title: "Micro foundations", description: "Choices at the margin.",
      lessons: [lesson("Opportunity cost is the real price", "What you give up, not just what you pay in cash.", 14,
`## Definition
Opportunity cost is the value of the next-best alternative you did not choose.

## Margin
Most decisions are “one more hour,” not all-or-nothing.`,
        [{ prompt: "Opportunity cost is best described as…", choices: ["The money printed by a bank", "The next-best alternative given up", "Total revenue minus rent", "A type of tax"], answerIndex: 1, explanation: "The value of what you forgo." }])],
    }],
  },
  {
    slug: "cs-principles", title: "Computer Science Principles", subject: "Computer Science",
    description: "How computers represent information, algorithms, the internet, and the social impact of code.",
    gradeBand: "Grades 9–12", color: "#22D3EE", icon: "</>",
    units: [{
      title: "Algorithms", description: "Clear steps that a machine can run.",
      lessons: [lesson("An algorithm is a recipe with no vibes", "Finite, definite steps that terminate with a result.", 16,
`## Properties
Input/output, definiteness, finiteness, effectiveness.

## Efficiency
Linear search is O(n). Binary search on a sorted list is O(log n).`,
        [{ prompt: "Binary search requires the list to be…", choices: ["Random", "Sorted", "Infinite", "Encrypted"], answerIndex: 1, explanation: "You can only discard half if you know the order." }])],
    }],
  },
  {
    slug: "health", title: "Health", subject: "Health",
    description: "Sleep, stress, nutrition, mental health literacy, and making decisions under peer pressure.",
    gradeBand: "Grades 9–12", color: "#86EFAC", icon: "♡",
    units: [{
      title: "Brain and body", description: "What teenagers can actually control.",
      lessons: [lesson("Sleep is a performance drug you already own", "Circadian delay in adolescence is biology, not laziness.", 13,
`## Biology
Teen melatonin often kicks in later.

## What sleep does
Memory consolidation, emotional regulation, immune function, reaction time.`,
        [{ prompt: "Adolescent sleep timing tends to shift…", choices: ["Earlier", "Later", "Randomly each hour", "Only during summer"], answerIndex: 1, explanation: "Circadian phase delay is common in puberty." }])],
    }],
  },
  {
    slug: "spanish-1", title: "Spanish I", subject: "World Languages",
    description: "High-frequency words, present tense, and enough structure to start real conversations.",
    gradeBand: "Grades 9–12", color: "#FCD34D", icon: "ES",
    units: [{
      title: "Foundations", description: "Sounds, greetings, ser vs estar.",
      lessons: [lesson("Ser vs estar without the usual confusion", "Essence vs state. Identity vs condition.", 15,
`## Ser
Identity, origin, time, occupation, definitional traits.
Soy estudiante. Son las tres.

## Estar
Location, feelings, conditions, progressive.
Estoy cansado. Estamos en clase.`,
        [{ prompt: "Which verb completes: Yo ___ en la biblioteca.", choices: ["soy", "estoy", "somos", "eres"], answerIndex: 1, explanation: "Location uses estar." }])],
    }],
  },
  {
    slug: "environmental-science", title: "Environmental Science", subject: "Science",
    description: "Energy, ecosystems, climate, and the tradeoffs inside every “green” claim.",
    gradeBand: "Grades 10–12", color: "#84CC16", icon: "♻",
    units: [{
      title: "Climate systems", description: "Carbon and feedbacks.",
      lessons: [lesson("Greenhouse effect vs climate change", "One is a natural blanket. The other is us thickening it.", 17,
`## Greenhouse effect
CO₂, methane, and water vapor trap outgoing infrared. Without it, Earth would be frozen.

## Enhanced greenhouse effect
Fossil fuels and land-use change raise concentrations and trap more heat.

## Weather vs climate
Weather is a day. Climate is the long pattern.`,
        [{ prompt: "The natural greenhouse effect…", choices: ["Does not exist", "Keeps Earth warmer than it would be otherwise", "Is caused only by plastic", "Means there is no atmosphere"], answerIndex: 1, explanation: "Greenhouse gases raise surface temperature." }])],
    }],
  },
  {
    slug: "studio-art", title: "Studio Art", subject: "Arts",
    description: "Seeing, composing, and critiquing: value, color, and the language of a critique.",
    gradeBand: "Grades 9–12", color: "#FCA5A5", icon: "🎨",
    units: [{
      title: "Foundations", description: "The formal elements you can actually control.",
      lessons: [lesson("Value does more work than color", "Light and dark build form. Color rides on top.", 16,
`## Value
The lightness or darkness of a surface. A strong value structure still reads in grayscale.

## Practical test
Photograph your drawing in black and white. If the subject collapses, the values are too close.

## Critique sentence
“The midtones are bunched, so the form flattens; push one edge darker and reserve a true highlight.”`,
        [{ prompt: "The strongest way to check form in a drawing is to inspect…", choices: ["Only the frame size", "Value contrast (light vs dark)", "How expensive the paper was", "Whether the title is clever"], answerIndex: 1, explanation: "Value structure carries form." }])],
    }],
  },
  {
    slug: "personal-fitness", title: "Personal Fitness", subject: "Physical Education",
    description: "Training principles you can use outside the gym class period.",
    gradeBand: "Grades 9–12", color: "#FB923C", icon: "🏃",
    units: [{
      title: "Training sense", description: "Progression without wrecking yourself.",
      lessons: [lesson("Overload, recovery, consistency", "Fitness adapts to stress, then needs rest to keep the adaptation.", 14,
`## Overload
Do a little more than last week: more reps, slightly heavier, or a bit longer.

## Recovery
Sleep and rest days are part of the program, not a skip.

## Consistency
Three honest sessions beat one heroic one you cannot repeat.`,
        [{ prompt: "The overload principle says you should…", choices: ["Never change a workout", "Occasionally increase demand so the body adapts", "Train to failure every day", "Avoid rest days forever"], answerIndex: 1, explanation: "Progressive overload plus recovery." }])],
    }],
  },
];

async function main() {
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  await prisma.badge.createMany({
    data: [
      { slug: "first-lesson", title: "First light", description: "Finish your first lesson." },
      { slug: "quiz-ace", title: "Quiz ace", description: "Score 100% on a quiz." },
      { slug: "three-streak", title: "Three-day streak", description: "Learn three days in a row." },
      { slug: "polymath", title: "Polymath", description: "Enroll in three different subjects." },
    ],
  });

  await prisma.user.create({
    data: {
      name: "Ada Demo",
      email: "ada@lumina.edu",
      passwordHash: await bcrypt.hash("demo1234", 10),
      gradeLevel: 11,
      xp: 40,
      streak: 2,
    },
  });

  for (const course of courses) {
    const createdCourse = await prisma.course.create({
      data: {
        slug: course.slug,
        title: course.title,
        subject: course.subject,
        description: course.description,
        gradeBand: course.gradeBand,
        color: course.color,
        icon: course.icon,
      },
    });
    for (const [uIndex, unit] of course.units.entries()) {
      const createdUnit = await prisma.unit.create({
        data: {
          courseId: createdCourse.id,
          title: unit.title,
          description: unit.description,
          order: uIndex + 1,
        },
      });
      for (const [lIndex, lesson] of unit.lessons.entries()) {
        const createdLesson = await prisma.lesson.create({
          data: {
            unitId: createdUnit.id,
            title: lesson.title,
            summary: lesson.summary,
            content: lesson.content,
            estimatedMinutes: lesson.minutes,
            order: lIndex + 1,
          },
        });
        const quiz = await prisma.quiz.create({
          data: { lessonId: createdLesson.id, title: `${lesson.title} check` },
        });
        for (const q of lesson.questions) {
          await prisma.question.create({
            data: {
              quizId: quiz.id,
              prompt: q.prompt,
              choices: JSON.stringify(q.choices),
              answerIndex: q.answerIndex,
              explanation: q.explanation,
            },
          });
        }
      }
    }
  }

  console.log("Seeded Lumina. Demo login: ada@lumina.edu / demo1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
