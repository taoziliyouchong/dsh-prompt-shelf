const PACKAGE_NAME = 'dsh-prompt-shelf'

/** Cordis companion plugin name. */
export const name = 'dsh-prompt-shelf-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

const install = () => {}

export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
