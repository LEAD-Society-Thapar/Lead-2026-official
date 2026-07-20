// teamData.js — Executive roster
//
// Images in src/assets/ must be imported so Vite fingerprints and bundles them.
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
    github: "yuvraj-malik",
    linkedin: "yuvraj-malik",
  },
  {
    id: 2,
    firstName: "Manya",
    name: "Manya Kedia",
    role: "Joint Secretary",
    portrait: manyaImg,
    portraitPosition: "center 15%",      // panel only
    cardPortraitPosition: "center 0%",   // card thumbnail — unchanged
    statement: "Coordination is an art form. I make sure every moving part knows its role and hits its mark.",
    github: "manya-kedia",
    linkedin: "manya-kedia",
  },
  {
    id: 3,
    firstName: "Ishita",
    name: "Ishita Sachdeva",
    role: "General Secretary",
    portrait: ishitaImg,
    portraitPosition: "center 5%",
    statement: "Building bridges between vision and execution — every initiative is a chance to move the needle.",
    github: "ishita-sachdeva",
    linkedin: "ishita-sachdeva",
  },
  {
    id: 4,
    firstName: "Aanvy",
    name: "Aanvy Singh",
    role: "Finance Secretary",
    // ponytail: placeholder until Aanvy.webp is provided — swap import above when ready
    portrait: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80",
    statement: "Numbers tell stories. I translate financial data into strategic decisions that matter.",
    github: "aanvy-singh",
    linkedin: "aanvy-singh",
  },
  {
    id: 5,
    firstName: "Rajat",
    name: "Rajat Verma",
    role: "Tech Head",
    // ponytail: placeholder until Rajat.webp is provided
    portrait: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80",
    statement: "Every pixel has a purpose. Every line of code is a promise to the user.",
    github: "rajat-verma",
    linkedin: "rajat-verma",
  },
  {
    id: 6,
    firstName: "Pratham",
    name: "Pratham Arora",
    role: "Designing Head",
    // ponytail: placeholder until Pratham.webp is provided
    portrait: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
    statement: "Design is not decoration — it's the language through which ideas become real.",
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
    github: "akshat-gupta",
    linkedin: "akshat-gupta",
  },
  {
    id: 8,
    firstName: "Abhinav",
    name: "Abhinav Gupta",
    role: "Content Head",
    portrait: abhinavImg,
    portraitPosition: "center 0%",
    statement: "Words are the architecture of ideas. I build narratives that resonate long after the scroll.",
    github: "abhinav-gupta",
    linkedin: "abhinav-gupta",
  },
  {
    id: 9,
    firstName: "Atulya",
    name: "Atulya Kumar Singh",
    role: "Social Media & PR Head",
    // ponytail: placeholder until Atulya.webp is provided
    portrait: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80",
    statement: "Attention is the new currency. I spend it wisely — and never stop earning more.",
    github: "atulya-singh",
    linkedin: "atulya-singh",
  },
  {
    id: 10,
    firstName: "Saanvi",
    name: "Saanvi Aggarwal",
    role: "Event Head",
    portrait: saanviImg,
    statement: "Events are time-boxed magic. I engineer the conditions for moments people never forget.",
    github: null,
    linkedin: "https://www.linkedin.com/in/saanvi-aggarwal-94306b2bb?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  },
  {
    id: 11,
    firstName: "Jasmine",
    name: "Jasmine Kaur",
    role: "Logistics Head",
    portrait: jasmineImg,
    statement: "Flawless execution isn't luck — it's a system I've built and rebuilt until nothing breaks.",
    github: "jasmine-kaur",
    linkedin: "jasmine-kaur",
  },
  {
    id: 12,
    firstName: "Shreya",
    name: "Shreya",
    role: "Creativity Head",
    portrait: shreyaImg,
    portraitPosition: "center 35%",
    statement: "Constraints are the mother of creativity. I thrive in the space between impossible and done.",
    github: "shreya-singla",
    linkedin: "shreya-singla",
  },
];
