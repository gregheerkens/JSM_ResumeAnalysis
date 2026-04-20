export const resumes: Resume[] = [
    {
      id: "1",
      companyName: "Google",
      jobTitle: "Frontend Developer",
      imagePath: "/images/resume_01.png",
      resumePath: "/resumes/resume-1.pdf",
      feedback: {
        overallScore: 85,
        ATS: {
          score: 90,
          tips: [],
        },
        toneAndStyle: {
          score: 90,
          tips: [],
        },
        content: {
          score: 90,
          tips: [],
        },
        structure: {
          score: 90,
          tips: [],
        },
        skills: {
          score: 90,
          tips: [],
        },
      },
    },
    {
      id: "2",
      companyName: "Microsoft",
      jobTitle: "Cloud Engineer",
      imagePath: "/images/resume_02.png",
      resumePath: "/resumes/resume-2.pdf",
      feedback: {
        overallScore: 55,
        ATS: {
          score: 90,
          tips: [],
        },
        toneAndStyle: {
          score: 90,
          tips: [],
        },
        content: {
          score: 90,
          tips: [],
        },
        structure: {
          score: 90,
          tips: [],
        },
        skills: {
          score: 90,
          tips: [],
        },
      },
    },
    {
      id: "3",
      companyName: "Apple",
      jobTitle: "iOS Developer",
      imagePath: "/images/resume_03.png",
      resumePath: "/resumes/resume-3.pdf",
      feedback: {
        overallScore: 75,
        ATS: {
          score: 90,
          tips: [],
        },
        toneAndStyle: {
          score: 90,
          tips: [],
        },
        content: {
          score: 90,
          tips: [],
        },
        structure: {
          score: 90,
          tips: [],
        },
        skills: {
          score: 90,
          tips: [],
        },
      },
    },
  ];
  
  export const AIResponseFormat = `
        interface Feedback {
        overallScore: number; //max 100
        ATS: {
          score: number; //rate based on ATS suitability
          tips: {
            type: "good" | "improve";
            tip: string; //give 3-4 tips
          }[];
        };
        toneAndStyle: {
          score: number; //max 100
          tips: {
            type: "good" | "improve";
            tip: string; //make it a short "title" for the actual explanation
            explanation: string; //explain in detail here
          }[]; //give 3-4 tips
        };
        content: {
          score: number; //max 100
          tips: {
            type: "good" | "improve";
            tip: string; //make it a short "title" for the actual explanation
            explanation: string; //explain in detail here
          }[]; //give 3-4 tips
        };
        structure: {
          score: number; //max 100
          tips: {
            type: "good" | "improve";
            tip: string; //make it a short "title" for the actual explanation
            explanation: string; //explain in detail here
          }[]; //give 3-4 tips
        };
        skills: {
          score: number; //max 100
          tips: {
            type: "good" | "improve";
            tip: string; //make it a short "title" for the actual explanation
            explanation: string; //explain in detail here
          }[]; //give 3-4 tips
        };
      }`;
  
  export const prepareRewriteInstructions = ({
    jobTitle,
    jobDescription,
    feedback,
  }: {
    jobTitle: string;
    jobDescription: string;
    feedback: Feedback;
  }) =>
    `You are an expert resume writer and career strategist specializing in ATS optimization.

    You have already analyzed this resume and identified the following gaps and strengths:
    - Overall score: ${feedback.overallScore}/100
    - ATS score: ${feedback.ATS.score}/100
    - Key ATS issues: ${feedback.ATS.tips.filter(t => t.type === "improve").map(t => t.tip).join("; ")}
    - Content gaps: ${feedback.content.tips.filter(t => t.type === "improve").map(t => t.tip).join("; ")}
    - Skills gaps: ${feedback.skills.tips.filter(t => t.type === "improve").map(t => t.tip).join("; ")}

    Now rewrite this resume tailored specifically for the following role:
    Job Title: ${jobTitle}
    Job Description: ${jobDescription}

    Rules:
    - Directly address every gap identified in your analysis above
    - Mirror the exact language and keywords from the job description naturally — do not stuff keywords awkwardly
    - Lead with what this specific listing prioritizes most
    - Keep all facts, roles, titles, dates, and achievements 100% accurate — do not fabricate anything
    - You may reframe, reorder, emphasize, and strengthen language — but only what is already true
    - Write in a natural human voice. Avoid AI-generated patterns that make the output detectable as machine-written:
      - No em dashes (—) anywhere in the document
      - No phrases like "spearheaded", "leveraged", "orchestrated", "fostered", "championed", "revolutionized", "transformative", "cutting-edge", "synergy", or similar corporate filler
      - No nested bullet points or excessive bold formatting
      - Prefer plain, direct language over inflated descriptors
      - Sentence rhythm should vary naturally — not every bullet should follow the exact same grammatical structure
    - Return the rewritten resume as clean markdown only, no commentary, no preamble, no explanation.`;

  export const prepareInstructions = ({
    jobTitle,
    jobDescription,
    AIResponseFormat,
  }: {
    jobTitle: string;
    jobDescription: string;
    AIResponseFormat: string;
  }) =>
    `You are an expert in ATS (Applicant Tracking System) and resume analysis.
    Please analyze and rate this resume and suggest how to improve it.
    The rating can be low if the resume is bad.
    Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
    If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.
    If available, use the job description for the job user is applying to to give more detailed feedback.
    If provided, take the job description into consideration.
    The job title is: ${jobTitle}
    The job description is: ${jobDescription}
    Provide the feedback using the following format: ${AIResponseFormat}
    Return the analysis as a JSON object, without any other text and without the backticks.
    Do not include any other text or comments.`;