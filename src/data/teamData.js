// teamData.js — Executive roster
//
// Images in src/assets/team/ must be imported so Vite fingerprints and bundles them.
// The 4 missing portraits (Aanvy, Rajat, Pratham, Atulya) still use Unsplash
// as placeholders — replace the import + portrait field when images are ready.

import yuvrajImg  from '../assets/team/Yuvraj.webp';
import manyaImg   from '../assets/team/Manya.webp';
import ishitaImg  from '../assets/team/Ishita.webp';
import saanviImg  from '../assets/team/Saanvi.webp';
import akshatImg  from '../assets/team/Akshat.jpg';
import abhinavImg from '../assets/team/Abhinav.webp';
import jasmineImg from '../assets/team/Jasmine.webp';
import shreyaImg  from '../assets/team/Shreya.webp';
import aanvyImg   from '../assets/team/Aanvy.webp';
import rajatImg   from '../assets/team/Rajat.webp';
import prathamImg from '../assets/team/Pratham.webp';
import atulyaImg  from '../assets/team/Atulya.webp';

export const executives = [
  {
    id: 1,
    firstName: "Yuvraj",
    name: "Yuvraj Malik",
    role: "Technical Secretary",
    portrait: yuvrajImg,
    portraitPosition: "center 45%",      // panel only
    cardPortraitPosition: "center 35%",  // card thumbnail — unchanged
    statement: "Technology should feel invisible and inevitable. I build systems that just work.",
    about: "Yuvraj Malik serves as the Technical Secretary of LEAD, playing a key role in ensuring smooth coordination across the technical domain. With a proactive mindset, strong organizational skills, and a collaborative approach, he supports the team in transforming ideas into well-executed initiatives. His dedication, reliability, and ability to foster effective communication make him an integral part of the society.",
    github: "yuvraj-malik",
    linkedin: "https://www.linkedin.com/in/yuvraj-malik27/",
  },
  {
    id: 2,
    firstName: "Manya",
    name: "Manya Kedia",
    role: "Joint Secretary",
    portrait: manyaImg,
    portraitPosition: "center 45%",      // panel only
    cardPortraitPosition: "center 0%",   // card thumbnail — unchanged
    statement: "Coordination is an art form. I make sure every moving part knows its role and hits its mark.",
    about: "Believing that every challenge is an opportunity to innovate, Manya Kedia serves as the Joint Secretary of LEAD Society with dedication and purpose. Through thoughtful leadership, effective collaboration, and a passion for turning ideas into reality, she strives to build an environment where creativity flourishes, teamwork thrives, and every member is empowered to contribute their best.",
    github: "manya-kedia",
    linkedin: "https://www.linkedin.com/in/manya-kedia-157b08272/",
  },
  {
    id: 3,
    firstName: "Ishita",
    name: "Ishita Sachdeva",
    role: "General Secretary",
    portrait: ishitaImg,
    portraitPosition: "center 5%",
    statement: "Building bridges between vision and execution — every initiative is a chance to move the needle.",
    about: "As General Secretary of LEAD Society, Ishita Sachdeva believes true leadership is about ensuring every voice is heard. Dedicated to the critical work behind the scenes, she focuses on turning ideas into action and cultivating a collaborative environment where all members are empowered to learn, lead, and build experiences they will value forever.",
    github: "ishita-sachdeva",
    linkedin: "https://www.linkedin.com/in/ishita-6a8674330/",
  },
  {
    id: 4,
    firstName: "Aanvy",
    name: "Aanvy Singh",
    role: "Finance Secretary",
    portrait: aanvyImg,
    portraitPosition: "center 75%",
    statement: "Numbers tell stories. I translate financial data into strategic decisions that matter.",
    about: "As Finance Secretary of LEAD Society, Aanvy Singh brings a unique blend of analytical expertise and resilient problem-solving to the team. A passionate robotics enthusiast, she moves beyond traditional number-crunching to manage budgets, secure funding, and drive resource allocation, ensuring a well-funded and impactful year ahead.",
    github: "aanvy-singh",
    linkedin: "https://www.linkedin.com/in/aanvy-singh/",
  },
  {
    id: 5,
    firstName: "Rajat",
    name: "Rajat Verma",
    role: "Tech Head",
    portrait: rajatImg,
    cardPortraitScale: 1.75,
    cardPortraitY: "-35px",
    statement: "Every pixel has a purpose. Every line of code is a promise to the user.",
    about: "Rajat Verma steps into the role of Technical Head, bringing a unique blend of technical mastery and dynamic storytelling to the team. As our primary digital architect, he seamlessly manages complex back-end operations, system logistics, and digital infrastructure with exceptional logic and ease.Beyond keeping our technical systems running without a hitch, he doubles as the team’s resident vlogger, effortlessly capturing the culture and behind-the-scenes energy of the society. His ability to combine sharp problem-solving skills with a creative, hands-on approach ensures our digital presence remains innovative, reliable, and engaging.",
    github: "rajat-verma",
    linkedin: "https://www.linkedin.com/in/rajatverma1090/",
  },
  {
    id: 6,
    firstName: "Pratham",
    name: "Pratham Arora",
    role: "Designing Head",
    portrait: prathamImg,
    portraitPosition: "center 25%",
    cardPortraitPosition: "center 20%",
    statement: "Design is not decoration — it's the language through which ideas become real.",
    about: "For Pratham, design is an expression of perspective, purpose, and storytelling. As LEAD’s Designing Head, he translates ideas into distinctive visual experiences through creativity, precision, and thoughtful execution. Beyond design, he finds inspiration in music, the ukulele, and conversations that challenge perspectives and spark creativity.",
    github: "pratham-arora",
    linkedin: "pratham-arora",
  },
  {
    id: 7,
    firstName: "Akshat",
    name: "Akshat Gupta",
    role: "Marketing Head",
    portrait: akshatImg,
    statement: "Marketing is empathy at scale. Understand one person deeply enough, and you reach millions.",
    about: "Akshat Gupta serves as the Marketing Head of LEAD, combining creativity with a people-first approach. Known for his strong communication skills and innovative ideas, he enjoys building meaningful collaborations, leading impactful campaigns, and ensuring every initiative reflects the vision and spirit of LEAD.",
    github: "akshat-gupta",
    linkedin: "https://www.linkedin.com/in/akshat-gupta-6a27a331a/",
  },
  {
    id: 8,
    firstName: "Abhinav",
    name: "Abhinav Gupta",
    role: "Content Head",
    portrait: abhinavImg,
    portraitPosition: "center 0%",
    statement: "Words are the architecture of ideas. I build narratives that resonate long after the scroll.",
    about: "Abhinav directs the narrative and editorial strategy at LEAD, crafting compelling stories that capture the essence of the community. His words inspire, inform, and unite members around a shared purpose.",
    github: "abhinav-gupta",
    linkedin: "https://www.linkedin.com/in/abhinav-gupta-a60083275/",
  },
  {
    id: 9,
    firstName: "Atulya",
    name: "Atulya Kumar Singh",
    role: "Social Media & PR Head",
    portrait: atulyaImg,
    portraitPosition: "center 25%",
    cardPortraitPosition: "center 20%",
    statement: "Attention is the new currency. I spend it wisely — and never stop earning more.",
    about: "Atulya manages LEAD's public relations and digital presence, building strong media connections and active online channels. He ensures the organization's achievements resonate across all social platforms.",
    github: "atulya-singh",
    linkedin: "https://www.linkedin.com/in/atulya-kumar-singh-9508b5306/",
  },
  {
    id: 10,
    firstName: "Saanvi",
    name: "Saanvi Aggarwal",
    role: "Event Head",
    portrait: saanviImg,
    statement: "Events are time-boxed magic. I engineer the conditions for moments people never forget.",
    about: "Saanvi steps into the role of event management head, bringing a clear vision and strong leadership to the team. Known for her exceptional clarity of thought, she has a natural ability to streamline complex event logistics and guide projects from concept to execution with ease. Saanvi leads with absolute dedication, sharp problem-solving skills, and unwavering grace under pressure. Whether she is mapping out long-term strategies or managing tight deadlines, her focus and high standards ensure every initiative under her direction is structured for success.",
    github: null,
    linkedin: "https://www.linkedin.com/in/saanvi-aggarwal-94306b2bb?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  },
  {
    id: 11,
    firstName: "Jasmine",
    name: "Jasmine Kaur",
    role: "Logistics Head",
    portrait: jasmineImg,
    portraitPosition: "center 30%",
    portraitScale: 0.9,
    statement: "Flawless execution isn't luck — it's a system I've built and rebuilt until nothing breaks.",
    about: "Jasmine commands the operational backbone of LEAD, managing supply chains, venue logistics, and real-time execution. Her systematic approach ensures every event and initiative runs without a hitch.",
    github: "jasmine-kaur",
    linkedin: "https://www.linkedin.com/in/jasmine-kaur-463a3a324/",
  },
  {
    id: 12,
    firstName: "Shreya",
    name: "Shreya",
    role: "Creativity Head",
    portrait: shreyaImg,
    portraitPosition: "center 80%",
    statement: "Constraints are the mother of creativity. I thrive in the space between impossible and done.",
    about: "For Shreya, creativity is about giving ideas a purpose and transforming them into experiences that resonate. As the Creativity Head at LEAD, she enjoys leading creative initiatives, encouraging collaboration, and exploring innovative approaches that inspire meaningful outcomes. With a deep appreciation for Mandala art and calligraphy, she brings patience, precision, and a thoughtful perspective to every project she undertakes.",
    github: "shreya041006",
    linkedin: "https://www.linkedin.com/in/shreya-599261328/",
  },
];
