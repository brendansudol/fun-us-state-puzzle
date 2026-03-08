"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";

import { getSuggestions } from "@/lib/puzzle";
import type { StateCode, StateRecord } from "@/lib/types";

interface GuessInputProps {
  states: StateRecord[];
  guessedCodes: StateCode[];
  disabled: boolean;
  error: string | null;
  onSubmitGuess: (value: string) => boolean;
}

export function GuessInput({
  states,
  guessedCodes,
  disabled,
  error,
  onSubmitGuess,
}: GuessInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredValue = useDeferredValue(value);
  const suggestions = getSuggestions(deferredValue, states, guessedCodes);

  useEffect(() => {
    setActiveIndex(0);
  }, [deferredValue]);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  function submit(candidate: string) {
    const didSubmit = onSubmitGuess(candidate);

    if (didSubmit) {
      setValue("");
      setActiveIndex(0);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (suggestions[activeIndex]) {
        submit(suggestions[activeIndex].name);
        return;
      }

      submit(value);
    }
  }

  return (
    <section className="panelCard inputCard">
      <label className="label" htmlFor="state-guess">
        Enter a state name or USPS abbreviation
      </label>

      <div className="inputWrap">
        <input
          ref={inputRef}
          id="state-guess"
          className="guessInput"
          type="text"
          placeholder="Try Georgia or GA"
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-describedby={error ? "guess-error" : undefined}
        />

        {suggestions.length > 0 && value.trim() && !disabled ? (
          <ul className="suggestions" role="listbox" aria-label="State suggestions">
            {suggestions.map((state, index) => (
              <li key={state.code}>
                <button
                  className="suggestionButton"
                  type="button"
                  data-active={index === activeIndex}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    submit(state.name);
                  }}
                >
                  <span>{state.name}</span>
                  <span className="guessCode">{state.code}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="inputActions">
        <button className="button" type="button" disabled={disabled} onClick={() => submit(value)}>
          Submit guess
        </button>
      </div>

      {error ? (
        <p id="guess-error" className="inputError" role="status">
          {error}
        </p>
      ) : null}
    </section>
  );
}
