import Handlebars from "handlebars";

export function createHandlebarsInstance(): typeof Handlebars {
  const hbs = Handlebars.create();

  // Helper: check equality
  hbs.registerHelper("eq", (a, b) => a === b);

  // Helper: check inequality
  hbs.registerHelper("ne", (a, b) => a !== b);

  // Helper: logical OR
  hbs.registerHelper("or", (a, b) => a || b);

  // Helper: clean tel link
  hbs.registerHelper("phoneLink", (phone: string) => {
    if (!phone) return "#";
    return `tel:${phone.replace(/[^\d+]/g, "")}`;
  });

  // Helper: current year
  hbs.registerHelper("currentYear", () => new Date().getFullYear());

  // Helper: JSON stringify for Schema
  hbs.registerHelper("json", (context) => JSON.stringify(context));

  return hbs;
}

export const hbsInstance = createHandlebarsInstance();
