import type { Metadata, Site, Socials } from "@types";

export const SITE: Site = {
  TITLE: "The Cassetta's Reboot",
  DESCRIPTION: "A new life for the Cassetta's family",
  EMAIL: "cristiancassetta@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 5,
  NUM_PROJECTS_ON_HOMEPAGE: 0,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "The Cassetta's are going through a big change",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "Our adventures",
};

export const PROJECTS: Metadata = {
  TITLE: "About",
  DESCRIPTION: "Who are the members of the Cassetta's family",
};

export const SOCIALS: Socials = [
  {
    NAME: "X (formerly Twitter)",
    HREF: "https://twitter.com/boogerbuttcheeks",
  },
  {
    NAME: "GitHub",
    HREF: "https://github.com/trevortylerlee",
  },
  {
    NAME: "LinkedIn",
    HREF: "https://www.linkedin.com/in/trevortylerlee",
  },
];
