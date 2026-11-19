import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const Prose = ({ title, updated, children }) => (
  <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
    {updated && <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>}
    <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-foreground/90 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
      {children}
    </div>
  </article>
);

export const About = () => {
  useDocumentTitle("About");
  return (
    <Prose title="About SkillFound">
      <p>
        SkillFound is a job board that tells you how well you fit a role before you apply. Upload your resume once and every
        listing shows a match score, the reasons behind it and the skills you're missing.
      </p>
      <p>
        For recruiters it turns a few notes into a clear job post and orders applicants by fit, with a one-line reason for each.
      </p>
      <h2>How it's built</h2>
      <p>
        MongoDB, Express, React and Node, with Google Gemini for resume parsing, match scores, search and recruiter tools. The
        AI parts are optional: if they're unavailable, search falls back to keywords and everything else keeps working.
      </p>
      <h2>Sample data</h2>
      <p>
        SkillFound is an independent project by Dhairya Shah. The companies, jobs and applicants you see are sample data
        created to show how the product works; they don't describe real employers or people.
      </p>
      <p>
        The source code is on{" "}
        <a href="https://github.com/dhairya0609/SkillFound" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
          GitHub
        </a>
        .
      </p>
    </Prose>
  );
};

export const Privacy = () => {
  useDocumentTitle("Privacy");
  return (
    <Prose title="Privacy" updated="November 2026">
      <p>This page explains what SkillFound stores and where it goes. Short version: only what the product needs.</p>
      <h2>What we store</h2>
      <ul>
        <li>Your account details: name, email, phone number, role and a hashed password.</li>
        <li>Your profile: headline, bio, skills, experience summary, location, and any resume or photo you upload.</li>
        <li>Your applications and their status, and the jobs and companies recruiters create.</li>
        <li>Match scores we calculate for you, so they load instantly next time.</li>
        <li>Jobs you save and searches you turn into alerts.</li>
        <li>Reports you send about a job, kept with your account or, if you're signed out, your IP address.</li>
      </ul>
      <h2>AI processing</h2>
      <p>
        Resume autofill, match scores, plain-English search, job description drafts and applicant ranking send the relevant text
        to Google's Gemini API. For ranking we send skills and experience only, never names or contact details. We don't log
        prompts or responses.
      </p>
      <h2>What employers see</h2>
      <p>
        When you apply, the employer sees your profile, email and resume. Your phone number is only shown once they shortlist
        you, and they can see when your application was viewed and how it moved through their pipeline.
      </p>
      <h2>Files and cookies</h2>
      <p>
        Resumes, photos and logos are stored with Cloudinary. We use one HTTP-only cookie to keep you logged in, and your browser
        stores your theme choice and session locally. There are no ads or third-party trackers.
      </p>
      <h2>Demo accounts</h2>
      <p>
        The demo candidate and recruiter accounts are shared by everyone who uses them. Don't put personal information into
        them; anything you add there is visible to other visitors and is cleared periodically.
      </p>
      <h2>Your choices</h2>
      <p>
        You can edit your profile at any time. To delete your account or data, open an issue on the project's{" "}
        <a href="https://github.com/dhairya0609/SkillFound/issues" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
          GitHub page
        </a>
        .
      </p>
    </Prose>
  );
};

export const Terms = () => {
  useDocumentTitle("Terms");
  return (
    <Prose title="Terms of use" updated="November 2026">
      <p>By using SkillFound you agree to these terms.</p>
      <h2>Using the service</h2>
      <ul>
        <li>Post accurate information about yourself, your company and your roles.</li>
        <li>Don't post anything unlawful, discriminatory, misleading or that you don't have the right to share.</li>
        <li>Don't try to break, overload or scrape the service. AI features have usage limits to keep them available for everyone.</li>
      </ul>
      <h2>AI suggestions</h2>
      <p>
        Match scores, rankings and drafted text are suggestions. Check them before relying on them; hiring decisions remain
        yours.
      </p>
      <h2>Sample content</h2>
      <p>
        Companies and jobs shown on SkillFound are sample data for demonstration. Applying to them doesn't send your details to a
        real employer.
      </p>
      <h2>No warranty</h2>
      <p>
        SkillFound is provided as is, without guarantees of availability or fitness for a purpose. See also our{" "}
        <Link to="/privacy" className="font-medium underline underline-offset-4">
          privacy page
        </Link>
        .
      </p>
    </Prose>
  );
};
