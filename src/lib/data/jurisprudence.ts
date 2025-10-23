// Jurisprudence quiz data structure
export interface JurisprudenceQuestion {
  qid: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

export interface JurisprudenceTopic {
  topic: string;
  questions: JurisprudenceQuestion[];
}

export interface JurisprudenceData {
  jurisprudence_questions: JurisprudenceTopic[];
}

// Convert the JSON structure to our quiz format
export const jurisprudenceData: JurisprudenceData = {
  jurisprudence_questions: [
    {
      topic: "Introduction to Jurisprudence",
      questions: [
        {
          qid: "a1",
          question:
            "The term 'jurisprudence' is derived from the Latin word 'jurisprudentia'. According to the text, what is its literal meaning?",
          option_a: "The command of the sovereign",
          option_b: "The observation of things human and divine",
          option_c: "Skill or knowledge of the law",
          option_d: "The first principles of civil law",
          correct_answer: "C. Skill or knowledge of the law",
          explanation:
            "The text begins by stating, \"The term jurisprudence has been derived from the Latin word 'jurisprudentia' which means 'skill or knowledge of the law'.\"",
        },
        {
          qid: "a2",
          question:
            "Which jurist is credited as the 'Father of Jurisprudence' and was the first to analyze what law is by dividing its study into 'Expositorial' and 'Censorial' approaches?",
          option_a: "John Austin",
          option_b: "Salmond",
          option_c: "Jeremy Bentham",
          option_d: "Holland",
          correct_answer: "C. Jeremy Bentham",
          explanation:
            'The material clearly identifies, "Bentham is known as Father of Jurisprudence was the first one to analyze what is the law." It also explains his division of study into the Expositorial (law as it is) and Censorial (law as it ought to be) approaches.',
        },
        {
          qid: "a3",
          question:
            "John Austin, the 'Father of English Jurisprudence', opined that the appropriate subject of jurisprudence is:",
          option_a: "Natural Law",
          option_b: "Positive Law",
          option_c: "Moral Philosophy",
          option_d: "The principles of legislation",
          correct_answer: "B. Positive Law",
          explanation:
            'As per the text, "Austin...opines that the appropriate subject to jurisprudence is a positive law i.e. law as it is (existing law)." He distinguished this from natural, ideal, or moral law.',
        },
        {
          qid: "a4",
          question:
            "According to Holland's definition, jurisprudence is the \"Formal Science of positive law.\" What did he mean by the term 'formal'?",
          option_a:
            "It implies that the focus of jurisprudence is on the material substance and specific content of legal rules as they are found in statutes.",
          option_b:
            "It refers to the study of the fundamental principles governing human relations, rather than the specific details of the material rules themselves.",
          option_c:
            "It signifies that the discipline is primarily concerned with the official legal documents and the procedural formalities required by the courts.",
          option_d:
            "It suggests that a comprehensive and official education in the study of law is a necessary prerequisite for its proper understanding.",
          correct_answer:
            "B. It refers to the study of the fundamental principles governing human relations, rather than the specific details of the material rules themselves.",
          explanation:
            "This is the correct interpretation of Holland's definition. He used the term 'formal' to explain that jurisprudence is not a 'material' science. A material science would study the specific, concrete details and content of legal rules (e.g., the exact punishment for theft, the specific requirements for a valid contract). A formal science, in contrast, studies the underlying form, structure, and fundamental principles (like the concepts of rights, duties, possession, ownership) that are common across various legal systems.",
        },
        {
          qid: "a5",
          question:
            "In what the text calls the 'Specific sense', how did Salmond define jurisprudence?",
          option_a: "The Science of Civil Law",
          option_b:
            "The scientific synthesis of the essential principles of law",
          option_c: "The philosophy of positive law",
          option_d: "The science of the first principle of civil law",
          correct_answer: "D. The science of the first principle of civil law",
          explanation:
            "The text notes Salmond's two senses: \"(1) in the 'Generic Sense' jurisprudence can be defined as Science of Civil Law' and (2) in the 'Specific sense' Jurisprudence can be defined as the science of the first principle of civil law.\"",
        },
      ],
    },
    {
      topic: "Sources of Law",
      questions: [
        {
          qid: "b1",
          question:
            "According to the text, which of the following are the three primary sources of Law?",
          option_a: "Custom, Morality, and Religion",
          option_b: "Legislation, Precedent, and Justice",
          option_c: "Custom, Legislation, and Precedents",
          option_d: "The Sovereign, The Courts, and The People",
          correct_answer: "C. Custom, Legislation, and Precedents",
          explanation:
            'The section "Sources of Law" begins by explicitly listing the three sources: "1. Custom, 2. Legislation, 3. Precedents."',
        },
        {
          qid: "b2",
          question: "How does Salmond, in a strict sense, define legislation?",
          option_a: "All methods of law-making.",
          option_b:
            "Formal utterances of the legislative organs of the Society.",
          option_c:
            "The source from where the rules of laws declared by the competent authority are framed.",
          option_d: "Making of general orders by judges.",
          correct_answer:
            "C. The source from where the rules of laws declared by the competent authority are framed.",
          explanation:
            'The text provides Salmond\'s definition: "In a strict sense, legislation is the source from where the rules of laws declared by the competent authority are framed."',
        },
        {
          qid: "b3",
          question:
            "What is the central idea behind Holland's example of a footpath forming across a lawn?",
          option_a:
            "It explains how legislation is created by a sovereign authority.",
          option_b:
            "It illustrates how judicial precedents build upon one another over time.",
          option_c:
            "It demonstrates how a custom originates from a convenient course of conduct being followed repeatedly by people.",
          option_d: "It shows that laws must be written down to be effective.",
          correct_answer:
            "C. It demonstrates how a custom originates from a convenient course of conduct being followed repeatedly by people.",
          explanation:
            'The example describes one person crossing a lawn for convenience, followed by others, eventually creating a path. The text concludes, "The main characteristic of a custom...thus originates in the conscious choice of the more convenient of two acts."',
        },
        {
          qid: "b4",
          question:
            "As per the text, which of the following is cited as a reason why precedent is a valid source of law?",
          option_a: "It is based solely on pure logic.",
          option_b: "It prevents partiality on the part of judges.",
          option_c: "It allows judges to disregard legislation.",
          option_d: "It is the oldest form of lawmaking.",
          correct_answer: "B. It prevents partiality on the part of judges.",
          explanation:
            'The text lists five reasons why precedent is a source of law. Point 4 is that "It prevents partiality on the part of judges."',
        },
        {
          qid: "b5",
          question:
            "According to the definition provided by Talbot, J., what is an 'Obiter Dictum'?",
          option_a: "The binding rule of a case.",
          option_b: "A guide that must be followed by all inferior courts.",
          option_c:
            "An opinion on a point not necessary for the decision of the case.",
          option_d: "A formal utterance from a legislative organ.",
          correct_answer:
            "C. An opinion on a point not necessary for the decision of the case.",
          explanation:
            'The text quotes Talbot, J.: "An obiter Dictum is an opinion on some point that is not necessary for the decision of the case."',
        },
      ],
    },
    {
      topic: "Schools of Jurisprudence",
      questions: [
        {
          qid: "c1",
          question:
            "What is the primary focus of the Analytical School of Jurisprudence, also known as Positivism?",
          option_a:
            "To analyze the law of the land as it ought to be, based on moral standards.",
          option_b:
            "To analyze the law of the land as it exists today, irrespective of its historical or ethical significance.",
          option_c:
            "To study the universal and eternal character of law as derived from nature.",
          option_d: "To examine the working of law and its effect on society.",
          correct_answer:
            "B. To analyze the law of the land as it exists today, irrespective of its historical or ethical significance.",
          explanation:
            'The text explains that the Analytical school "deals with the present which means that its aim is to analyze the law of the land, as it exists today...irrespective of its historical background (origin) or ethical significance."',
        },
        {
          qid: "c2",
          question:
            "Jeremy Bentham's legal philosophy is known as 'Utilitarian Individualism', and its ultimate standard for judging law is based on:",
          option_a: "The command of the sovereign.",
          option_b: "The historical spirit of the people.",
          option_c:
            'The principle of pleasure and pain, aiming for "the greatest happiness of the greatest number".',
          option_d: "The norms derived from a 'Grundnorm'.",
          correct_answer:
            'C. The principle of pleasure and pain, aiming for "the greatest happiness of the greatest number".',
          explanation:
            'The text states that for Bentham, "the end of litigation is the greatest happiness of the greatest number" and that his "whole approach or the ultimate standards on which a law is judged was based on pleasure and pain."',
        },
        {
          qid: "c3",
          question:
            "According to Hans Kelsen, law norms are 'ought' (sollen) propositions. How does he believe a legal norm gets its validity?",
          option_a: "From the sanction that stands outside the rule of law.",
          option_b: "From its acceptance by the majority of the population.",
          option_c:
            "From a more general norm, in a hierarchy that ultimately traces back to the 'Grundnorm'.",
          option_d:
            "From the interpretation and application by a judge in a court case.",
          correct_answer:
            "C. From a more general norm, in a hierarchy that ultimately traces back to the 'Grundnorm'.",
          explanation:
            "The text describes Kelsen's theory: \"every legal act relates to a norm which gives legal validity to it...every norm forms its basis in another more general norm. This hierarchy goes down to the initial norm or hypothesis called 'Grundnorm'.\"",
        },
        {
          qid: "c4",
          question:
            "The text notes that Professor H.L.A. Hart criticized Austin's conception of law. What was Hart's primary criticism?",
          option_a: "Austin's theory was too focused on judge-made law.",
          option_b:
            "Austin's system based on coercive orders or sanctions would only apply to criminal law and not to civil laws like contracts or marriage.",
          option_c: "Austin did not support the codification of law.",
          option_d: "Austin's theory overemphasized the role of customs.",
          correct_answer:
            "B. Austin's system based on coercive orders or sanctions would only apply to criminal law and not to civil laws like contracts or marriage.",
          explanation:
            'The material states, "He has rejected any system of law based simply on coercive orders or sanctions as this will apply to criminal laws only and presently, there are even civil laws...like laws relating to marriage, contracts, wills etc."',
        },
        {
          qid: "c5",
          question:
            "Which jurist from the Analytical School held the view that judges are the 'creators of law' and not just discoverers, because even legislation gains meaning only after judicial interpretation?",
          option_a: "John Austin",
          option_b: "Hans Kelsen",
          option_c: "John Gray",
          option_d: "Jeremy Bentham",
          correct_answer: "C. John Gray",
          explanation:
            'According to the text, John Gray stated "that the Judges are creators of law and not the discoverers of law...even the legislation gains meaning after being interpreted by a court and applied in a concrete case."',
        },
      ],
    },
  ],
};

// Helper function to get questions by topic
export const getQuestionsByTopic = (
  topicName: string
): JurisprudenceQuestion[] => {
  const topic = jurisprudenceData.jurisprudence_questions.find(
    (t) => t.topic === topicName
  );
  return topic ? topic.questions : [];
};

// Helper function to get all topics
export const getAllTopics = (): string[] => {
  return jurisprudenceData.jurisprudence_questions.map((topic) => topic.topic);
};

// Helper function to get question by ID
export const getQuestionById = (qid: string): JurisprudenceQuestion | null => {
  for (const topic of jurisprudenceData.jurisprudence_questions) {
    const question = topic.questions.find((q) => q.qid === qid);
    if (question) return question;
  }
  return null;
};
