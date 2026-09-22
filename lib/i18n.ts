export const locales = ["en", "ru", "kk"] as const;
export type Locale = (typeof locales)[number];

export const messages = {
  en: {
    nav: { competitions: "Competitions", challenges: "Challenges", leaderboard: "Leaderboard", discuss: "Discuss", learn: "Learn" },
    common: { signIn: "Sign in", createAccount: "Create account", explore: "Explore competitions" },
  },
  ru: {
    nav: { competitions: "Соревнования", challenges: "Задачи", leaderboard: "Рейтинг", discuss: "Обсуждения", learn: "Обучение" },
    common: { signIn: "Войти", createAccount: "Создать аккаунт", explore: "Смотреть соревнования" },
  },
  kk: {
    nav: { competitions: "Жарыстар", challenges: "Сайыстар", leaderboard: "Рейтинг", discuss: "Талқылау", learn: "Үйрену" },
    common: { signIn: "Кіру", createAccount: "Тіркелу", explore: "Жарыстарды көру" },
  },
} satisfies Record<Locale, unknown>;
