# Tell Me About It.
💻 Built for the Encode Vibe Coding Hackathon (June 2025).
### A conversational, trauma-informed chatbot for automated SA report completion

## Why This Project?
83% of the 3.4 million acts of sexual violence (including rape) in England and Wales every year go unreported to the police [1](https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://committees.parliament.uk/writtenevidence/36494/html/&ved=2ahUKEwie-rurhoOOAxUVZ0EAHQbPIb8QFnoECBUQAw&usg=AOvVaw0JHzgogVQnYeXiil8CjrBi). That's approximately 2.8 million individuals who never receive official support or justice. The existing reporting system [2](https://www.police.uk/ro/report/rsa/alpha-v1/v1/rape-sexual-assault-other-sexual-offences/) is often a serious barrier to victims, making the formal process overwhelmingly long, difficult and, consequently, inaccessible.

We aimed to change that. By reframing the initial reporting process as a supportive conversation, we believe we can make this first step towards seeking support significantly easier for survivors. Instead of navigating pages and pages of questions on an online form, users can simply engage in a natural conversation, sharing as little or as much detail as they feel comfortable with. The chatbot intelligently extracts, organises and autofills the key information for them. Our goal is to transform this bureaucratic hurdle into a compassionate and accessible pathway to reporting.

## Core Functionality
Our chatbot's key features are designed for ease of use, security, and survivor-centric care.

- ***Speech-First Interaction***: Powered by **Eleven Labs API**, our project provides a fully voice-activated, natural conversational experience for incident reporting, with a text-based fallback. **Users can speak if they can't type, and type if they can't speak**. Accessibility is key.
- ***Intelligent Information Gathering***: Utilises Natural Language Processing (NLP) to extract key details from conversation, dynamically structuring and autofilling the report form
- ***Trauma-Informed Design***: Prioritises empathy, patience and non-judgement in every interaction. Users maintain control, with clear statements that it's **not a substitute for professional human support**.
- ***Robust Data Security & Privacy***: Despite the use of vibe coding throughout the development process, all user information is handled with paramount confidentiality, adhering to GDPR compliance (UK) through encryption and anonymisation to protect survivor anonymity. Consent is always explicitly sought before proceeding.
- ***Dynamic & Intuitive Interface***: Features a clean, calm-toned UI that visually updates the report form in real-time as information is provided, enhancing transparency and user experience.

## Future Developments
- ***Official Form Integration*** - Directly connecting this tool to official reporting platforms to seamlessly autofill collected incident details in the browser, would further streamline the formal reporting process.
- ***Multilingual Support*** - SA doesn't only happen to English speakers. Expanding language options to ensure victims from diverse linguistic backgrounds can access this crucial support would break down additional barriers to reporting.

## Setup

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
