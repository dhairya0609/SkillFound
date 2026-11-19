export const NO_RESPONSE_DAYS = 14;

export const isAwaitingTooLong = (application) => {
  if (!["applied", "viewed"].includes(application.status)) return false;
  const last = application.history?.at(-1)?.at || application.createdAt;
  return Date.now() - new Date(last).getTime() > NO_RESPONSE_DAYS * 24 * 60 * 60 * 1000;
};

export const STAGES = [
  { id: "applied", label: "New" },
  { id: "viewed", label: "Viewed" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interview" },
  { id: "offered", label: "Offer" },
];

export const PIPELINE_TABS = [...STAGES, { id: "rejected", label: "Not selected" }];

export const CONTACTABLE = ["shortlisted", "interview", "offered"];
