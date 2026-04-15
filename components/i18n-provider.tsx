"use client";
import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { useEffect, useState, ReactNode } from "react";
import { useResolvedLanguage } from "@/store";
import { Locale } from "@ziziyi/utils";
import { getTimeZone } from "@/i18n/config";
const messagesCache: Partial<Record<Locale, AbstractIntlMessages>> = {};
async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
  if (messagesCache[locale]) {
    return messagesCache[locale]!;
  }
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;
    messagesCache[locale] = messages;
    return messages;
  } catch {
    if (locale !== Locale.EN) {
      console.warn(
        `Messages for locale "${locale}" not found, falling back to English`,
      );
      return loadMessages(Locale.EN);
    }
    return {};
  }
}
interface I18nProviderProps {
  children: ReactNode;
  initialMessages: AbstractIntlMessages;
}
export function I18nProvider({ children, initialMessages }: I18nProviderProps) {
  const locale = useResolvedLanguage();
  const [messages, setMessages] =
    useState<AbstractIntlMessages>(initialMessages);
  const [currentLocale, setCurrentLocale] = useState<Locale>(Locale.EN);
  useEffect(() => {
    loadMessages(locale).then((loadedMessages) => {
      setMessages(loadedMessages);
      setCurrentLocale(locale);
    });
  }, [locale]);
  return (
    <NextIntlClientProvider
      locale={currentLocale}
      messages={messages}
      timeZone={getTimeZone(currentLocale)}
    >
      {children}
    </NextIntlClientProvider>
  );
}