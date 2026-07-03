// Единственный источник времени в приложении (спека §9).
// В тестах подменяется: jest.spyOn(clock, 'now').mockReturnValue(...)
export const clock = {
  now: (): number => Date.now(),
};
