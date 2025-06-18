/*
 * Copyright (c) 2014-2025 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import fs from 'node:fs/promises'
import config from 'config'
import pug from 'pug'

import * as utils from '../lib/utils'

export function errorHandler () {
  return async (error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error)
      return
    }

    if (req?.headers?.accept === 'application/json') {
      res.status(500).json({ error: JSON.parse(JSON.stringify(error)) })
      return
    }

    const templatePath = 'views/errorPage.pug'
    const template = await fs.readFile(templatePath, { encoding: 'utf-8' })
    const crypto = await import('node:crypto')
    const expectedHash = config.get<string>('templateHash') // Securely stored expected hash
    const actualHash = crypto.createHash('sha256').update(template).digest('hex')

    if (actualHash !== expectedHash) {
      res.status(500).send('Template integrity check failed.')
      return
    }

    const title = `${config.get<string>('application.name')} (Express ${utils.version('express')})`
    const fn = pug.compile(template)
    res.status(500).send(fn({ title, error }))
  }
}
