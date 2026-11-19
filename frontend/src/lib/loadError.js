export const classifyLoadError = (error, { subject = "this page" } = {}) => {
  const status = error?.response?.status;
  if (!error?.response) {
    const timedOut = error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "");
    return {
      kind: "network",
      title: timedOut ? "The server is taking a while" : "Can't reach SkillFound",
      message: timedOut
        ? "Our server sleeps when it's idle and can take up to a minute to wake. Try again in a moment."
        : "Check your connection. If it's fine, the server may be starting up; try again in a moment.",
    };
  }
  if (status === 401) {
    return {
      kind: "auth",
      title: "Log in to continue",
      message: `You need to be logged in to see ${subject}. If you were logged in, your session has expired.`,
    };
  }
  if (status === 403) {
    return { kind: "forbidden", title: "You don't have access", message: `Your account can't view ${subject}.` };
  }
  if (status === 404) {
    return { kind: "notfound", title: "Not found", message: `We couldn't find ${subject}. It may have been removed.` };
  }
  if (status >= 500) {
    return {
      kind: "server",
      title: "Something went wrong on our side",
      message: "The server hit an error or is still starting up. Try again in a moment.",
    };
  }
  return { kind: "other", title: `Couldn't load ${subject}`, message: "Please try again." };
};
