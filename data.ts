
import { Club, Activity, TeamMember, Achievement, CareerItem, AchievementPost } from './types.ts';

// A tiny valid 1-page PDF data URI for testing
const SAMPLE_PDF = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNTk1IDg0Ml0vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDQgMCBSPj4+Pi9Db250ZW50cyA1IDAgUj4+CmVuZG9iago0IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYT4+CmVuZG9iago1IDAgb2JqCjw8L0xlbmd0aCA0ND4+CnN0cmVhbQpCVAovRjEgMjQgVGYKNzAgNzAwIFRkCihUSVRBTiBDTFVCIElOVEVMTElHRU5DRSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTA3IDAwMDAwIG4gCjAwMDAwMDAyNDMgMDAwMDAgbiAKMDAwMDAwMDI5NiAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNi9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjM4OQolJUVPRgo=";

export const CLUBS: Club[] = [
  {
    id: 'c1',
    name: 'Titan Robotics',
    tagline: 'Designing the Future of Automation',
    description: 'The Robotics club of Titan focus on building autonomous systems and participating in national competitions.',
    bannerImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1200',
    logo: 'https://picsum.photos/seed/robo/100/100',
    themeColor: '#800000'
  },
  {
    id: 'c2',
    name: 'Titan Arts & Culture',
    tagline: 'Unleashing Creativity',
    description: 'Promoting cultural diversity and artistic expression through workshops and annual festivals.',
    bannerImage: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=1200',
    logo: 'https://picsum.photos/seed/arts/100/100',
    themeColor: '#800000'
  },
  {
    id: 'c3',
    name: 'Titan Coding Hub',
    tagline: 'Code, Innovate, Deploy',
    description: 'The premier coding community for building software and cracking algorithmic challenges.',
    bannerImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
    logo: 'https://picsum.photos/seed/code/100/100',
    themeColor: '#800000'
  }
];

export const ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    name: 'RoboWars 2024',
    clubId: 'c1',
    clubName: 'Titan Robotics',
    date: '2024-03-15',
    reportUrl: SAMPLE_PDF,
    photos: ['https://picsum.photos/seed/rw1/600/400', 'https://picsum.photos/seed/rw2/600/400']
  },
  {
    id: 'a2',
    name: 'Annual Cultural Fest',
    clubId: 'c2',
    clubName: 'Titan Arts & Culture',
    date: '2024-04-10',
    reportUrl: SAMPLE_PDF,
    photos: ['https://picsum.photos/seed/cf1/600/400']
  },
  {
    id: 'a3',
    name: 'Hack-The-Planet',
    clubId: 'c3',
    clubName: 'Titan Coding Hub',
    date: '2024-05-20',
    reportUrl: SAMPLE_PDF,
    photos: ['https://picsum.photos/seed/hp1/600/400', 'https://picsum.photos/seed/hp2/600/400']
  }
];

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 't1', name: 'Dr. Sarah Wilson', role: 'Faculty Coordinator', image: 'https://i.pravatar.cc/150?u=sarah' },
  { id: 't2', name: 'James Carter', role: 'President', image: 'https://i.pravatar.cc/150?u=james' },
  { id: 't3', name: 'Elena Rodriguez', role: 'Secretary', image: 'https://i.pravatar.cc/150?u=elena' },
  { id: 't4', name: 'Michael Chen', role: 'Treasury', image: 'https://i.pravatar.cc/150?u=mike' },
];

export const ACHIEVEMENTS: Achievement[] = [
  { 
    id: 'ac1', 
    participantName: 'Arsalaan Khan', 
    activityId: 'a3', 
    activityName: 'Hack-The-Planet', 
    achievement: 'Grand Champion', 
    certificateUrl: 'https://picsum.photos/seed/cert1/800/600', 
    userId: 'student3' 
  },
  { 
    id: 'ac2', 
    participantName: 'John Doe', 
    activityId: 'a1', 
    activityName: 'RoboWars 2024', 
    achievement: 'Gold Medal', 
    certificateUrl: 'https://picsum.photos/seed/cert2/800/600', 
    userId: 'student1' 
  }
];

export const STUDENT_POST_SAMPLES: AchievementPost[] = [
  {
    id: 'post_1',
    userId: 'student3',
    userName: 'Arsalaan Khan',
    timestamp: '1 hour ago',
    topic: 'Google Summer of Code 2025',
    domain: 'Open Source',
    rank: 'Accepted Contributor',
    description: 'Extremely hyped to announce that I have been selected as a GSoC contributor for the TensorFlow organization! Looking forward to working on distributed training optimizations. Huge shoutout to the Titan Coding Hub mentors.',
    photos: [
      'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    likes: ['u1', 'u2'],
    comments: []
  },
  {
    id: 'post_2',
    userId: 'student1',
    userName: 'John Doe',
    timestamp: '4 hours ago',
    topic: 'Smart India Hackathon Finals',
    domain: 'Software Edition',
    rank: 'Winner (₹1 Lakh)',
    description: 'We won the Smart India Hackathon 2024! Our team developed a blockchain-based land registry system for the Ministry of Rural Development. The 36-hour grind was worth every second.',
    photos: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800'
    ],
    likes: ['u3', 'u4', 'u5'],
    comments: [{ id: 'c1', userName: 'Arsalaan', text: 'Insane work guys! The UI was super slick.', timestamp: '30m ago' }]
  },
  {
    id: 'post_3',
    userId: 'student4',
    userName: 'Bob Brown',
    timestamp: 'Yesterday',
    topic: 'AWS Certified Solutions Architect',
    domain: 'Cloud Computing',
    rank: 'Associate Level',
    description: 'Successfully cleared the SAA-C03 exam today. Ready to build highly available and scalable systems on AWS. Titan Cloud mentors were instrumental in my prep!',
    photos: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800'],
    likes: ['u1'],
    comments: []
  }
];

export const CAREER_ITEMS: CareerItem[] = [
  // PLACEMENT OPPORTUNITIES
  { 
    id: 'cr1', 
    type: 'placement', 
    title: 'Software Engineer (L3)', 
    company: 'Google', 
    description: 'Join the Google Cloud Core team to build next-generation distributed storage systems. This role focuses on high-performance C++ and Go development.', 
    link: 'https://careers.google.com',
    requirements: 'Proficiency in DS/Algo, Systems Programming, Experience with GCP or AWS.',
    whoCanApply: 'Batch 2025 students with 8.0+ CGPA.',
    date: '2025-06-15'
  },
  { 
    id: 'cr2', 
    type: 'placement', 
    title: 'Product Analyst', 
    company: 'Microsoft', 
    description: 'Drive data-driven decisions for the Azure DevOps team. You will work with telemetry data to optimize developer workflows.', 
    link: 'https://careers.microsoft.com',
    requirements: 'Strong SQL, Python, PowerBI, and analytical mindset.',
    whoCanApply: 'Final year students across all branches.',
    date: '2025-05-10'
  },
  { 
    id: 'cr3', 
    type: 'placement', 
    title: 'Research Scientist', 
    company: 'NVIDIA', 
    description: 'Develop cutting-edge LLM quantization techniques for edge devices. Part of the AI Foundations research lab.', 
    link: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite',
    requirements: 'Deep knowledge of PyTorch, CUDA, and Transformer architectures.',
    whoCanApply: 'Post-graduate and exceptional undergraduate students.',
    date: '2025-08-01'
  },

  // PLACEMENT RECORDS (HALL OF FAME)
  {
    id: 'rec1',
    type: 'placement',
    isRecord: true,
    studentName: 'Arsalaan Khan',
    company: 'Google',
    title: 'Software Engineer',
    package: '45 LPA',
    studentPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    batch: '2025',
    quote: 'The mentorship at Titan Coding Hub was the differentiator. Grinding LeetCode in the hub paid off.',
    linkedinUrl: 'https://linkedin.com',
    description: 'Secured an elite off-campus offer through consistent open-source contributions and competitive programming excellence.'
  },
  {
    id: 'rec2',
    type: 'placement',
    isRecord: true,
    studentName: 'Alice Smith',
    company: 'Netflix',
    title: 'Frontend Engineer',
    package: '52 LPA',
    studentPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    batch: '2024',
    quote: 'Design meets code. Titan Arts & Culture helped me build a portfolio that caught the attention of global recruiters.',
    linkedinUrl: 'https://linkedin.com',
    description: 'Pioneered the new UI framework for the internal content management dashboard at Netflix.'
  },
  {
    id: 'rec3',
    type: 'placement',
    isRecord: true,
    studentName: 'Bob Brown',
    company: 'Tesla',
    title: 'Embedded Systems Engineer',
    package: '38 LPA',
    studentPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    batch: '2024',
    quote: 'Titan Robotics gave me hands-on experience with hardware that you just can\'t get in a classroom.',
    linkedinUrl: 'https://linkedin.com',
    description: 'Working on the Autopilot hardware integration team, focusing on sensor fusion and real-time processing.'
  },

  // INTERNSHIPS
  {
    id: 'int1',
    type: 'internship',
    title: 'Summer Research Intern',
    company: 'Meta AI',
    description: '3-month intensive internship focusing on generative video models and efficient fine-tuning strategies.',
    link: 'https://metacareers.com',
    requirements: 'Strong academic record, Publication in top AI conferences (preferred), Python expert.',
    whoCanApply: '3rd and 4th year students.',
    date: '2025-04-30'
  },
  {
    id: 'int2',
    type: 'internship',
    title: 'Cybersecurity Analyst Intern',
    company: 'CrowdStrike',
    description: 'Learn real-world threat hunting and malware analysis. You will be part of the Falcon OverWatch team.',
    link: 'https://crowdstrike.com/careers',
    requirements: 'Network security fundamentals, Knowledge of C/C++ and Assembly.',
    whoCanApply: 'CS/IT students with a passion for security.',
    date: '2025-05-15'
  },

  // HACKATHONS
  {
    id: 'hack1',
    type: 'hackathon',
    title: 'Smart India Hackathon 2025',
    company: 'Government of India',
    description: 'The world\'s largest open innovation model. Solve problem statements provided by central and state ministries.',
    date: '2025-01-20'
  }
];
