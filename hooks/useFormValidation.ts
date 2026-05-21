"use client";

import { useState, useCallback, useRef } from "react";

type Validator<V> = (value: V, allValues: Record<string, unknown>) => string | undefined;

type Rules<T extends Record<string, unknown>> = {
  [K in keyof T]?: Array<Validator<T[K]>>;
};

function runRules<T extends Record<string, unknown>>(
  values: T,
  rules: Rules<T>,
  keys?: Array<keyof T>,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  const keysToCheck = keys ?? (Object.keys(rules) as Array<keyof T>);
  for (const key of keysToCheck) {
    const fieldRules = rules[key];
    if (!fieldRules) continue;
    for (const rule of fieldRules) {
      const error = rule(values[key] as T[typeof key], values as Record<string, unknown>);
      if (error) {
        errors[key] = error;
        break;
      }
    }
  }
  return errors;
}

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  rules: Rules<T>,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const touchedRef = useRef<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value };
        if (touchedRef.current[key]) {
          setErrors((prevErrors) => {
            const fieldErrors = runRules(next, rules, [key]);
            const updated = { ...prevErrors };
            if (fieldErrors[key]) {
              updated[key] = fieldErrors[key];
            } else {
              delete updated[key];
            }
            return updated;
          });
        }
        return next;
      });
    },
    [rules],
  );

  const handleBlur = useCallback(
    <K extends keyof T>(key: K) => {
      touchedRef.current = { ...touchedRef.current, [key]: true };
      setValues((prev) => {
        setErrors((prevErrors) => {
          const fieldErrors = runRules(prev, rules, [key]);
          const updated = { ...prevErrors };
          if (fieldErrors[key]) {
            updated[key] = fieldErrors[key];
          } else {
            delete updated[key];
          }
          return updated;
        });
        return prev;
      });
    },
    [rules],
  );

  const validate = useCallback((): boolean => {
    const allKeys = Object.keys(rules) as Array<keyof T>;
    touchedRef.current = allKeys.reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Record<keyof T, boolean>,
    );
    setValues((prev) => {
      const allErrors = runRules(prev, rules);
      setErrors(allErrors);
      return prev;
    });
    const errs = runRules(values, rules);
    return Object.keys(errs).length === 0;
  }, [rules, values]);

  const reset = useCallback(
    (next?: Partial<T>) => {
      setValues(next ? { ...initialValues, ...next } : initialValues);
      setErrors({});
      touchedRef.current = {};
    },
    [initialValues],
  );

  return { values, errors, setValue, handleBlur, validate, reset };
}

// ─── Common validators ────────────────────────────────────────────────────────

export const required =
  (msg = "Este campo es requerido") =>
  (value: unknown): string | undefined => {
    if (value === null || value === undefined) return msg;
    if (typeof value === "string" && value.trim() === "") return msg;
    return undefined;
  };

export const minLength =
  (n: number, msg?: string) =>
  (value: string): string | undefined =>
    value && value.length < n ? msg ?? `Mínimo ${n} caracteres` : undefined;

export const maxLength =
  (n: number, msg?: string) =>
  (value: string): string | undefined =>
    value && value.length > n ? msg ?? `Máximo ${n} caracteres` : undefined;

export const isEmail =
  (msg = "Correo inválido") =>
  (value: string): string | undefined =>
    value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? msg : undefined;

export const isUrl =
  (msg = "URL inválida") =>
  (value: string): string | undefined => {
    if (!value) return undefined;
    try {
      new URL(value);
      return undefined;
    } catch {
      return msg;
    }
  };

export const minValue =
  (n: number, msg?: string) =>
  (value: number): string | undefined =>
    value !== undefined && value < n ? msg ?? `Valor mínimo: ${n}` : undefined;
