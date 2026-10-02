// Shared handles so slide controllers can talk to global effects.
export const fx = {
  /** @type {null | ReturnType<typeof import('../fx/background.js').createBackground>} */
  bg: null,
};
