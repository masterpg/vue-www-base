import * as express from 'express'
import * as firebaseAdmin from 'firebase-admin'

export interface Context {
  readonly req: express.Request

  readonly res: express.Response

  readonly user: firebaseAdmin.auth.DecodedIdToken

  setUser(user: firebaseAdmin.auth.DecodedIdToken): void
}
