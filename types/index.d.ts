interface Archetype {
    id: string;
    name: string;
    filePath: string;
  }

  interface Job {
    title: string;
    description: string;
    location: string;
    requiredSkills: string[];
  }
  
  interface Resume {
    id: string;
    companyName?: string;
    jobTitle?: string;
    jobDescription?: string;
    archetypeName?: string;
    imagePath: string;
    resumePath: string;
    feedback: Feedback;
    tailoredResume?: string;
  }

  interface Feedback {
    overallScore: number;
    ATS: {
      score: number;
      tips: {
        type: "good" | "improve";
        tip: string;
      }[];
    };
    toneAndStyle: {
      score: number;
      tips: {
        type: "good" | "improve";
        tip: string;
        explanation: string;
      }[];
    };
    content: {
      score: number;
      tips: {
        type: "good" | "improve";
        tip: string;
        explanation: string;
      }[];
    };
    structure: {
      score: number;
      tips: {
        type: "good" | "improve";
        tip: string;
        explanation: string;
      }[];
    };
    skills: {
      score: number;
      tips: {
        type: "good" | "improve";
        tip: string;
        explanation: string;
      }[];
    };
  }