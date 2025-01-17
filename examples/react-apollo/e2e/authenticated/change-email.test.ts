import { faker } from '@faker-js/faker'
import { expect, test } from '@playwright/test'
import { signUpWithEmailAndPassword, verifyEmail } from '../utils'

test('should be able to change email', async ({ page }) => {
  const email = faker.internet.email()
  const password = faker.internet.password()

  await page.goto('/')

  await signUpWithEmailAndPassword({ page, email, password })
  await expect(page.getByText(/verification email sent/i)).toBeVisible()

  const newPage = await verifyEmail({ page, email, context: page.context() })
  await newPage.getByRole('button', { name: /profile/i }).click()

  const newEmail = faker.internet.email()

  await newPage.getByPlaceholder(/new email/i).fill(newEmail)
  await newPage.locator('h1:has-text("Change email") + div button:has-text("Change")').click()

  await expect(
    newPage.getByText(/please check your inbox and follow the link to confirm the email change/i)
  ).toBeVisible()

  await newPage.getByRole('button', { name: /sign out/i }).click()

  const updatedEmailPage = await verifyEmail({
    page: newPage,
    email: newEmail,
    context: page.context(),
    linkText: /change email/i
  })

  await expect(updatedEmailPage.getByText(/profile page/i)).toBeVisible()
})

test('should not accept an invalid email', async ({ page }) => {
  const email = faker.internet.email()
  const password = faker.internet.password()

  await page.goto('/')

  await signUpWithEmailAndPassword({ page, email, password })
  await expect(page.getByText(/verification email sent/i)).toBeVisible()

  const newPage = await verifyEmail({ page, email, context: page.context() })
  await newPage.getByRole('button', { name: /profile/i }).click()

  const newEmail = faker.random.alphaNumeric()

  await newPage.getByPlaceholder(/new email/i).fill(newEmail)
  await newPage.locator('h1:has-text("Change email") + div button:has-text("Change")').click()

  await expect(newPage.getByText(/email is incorrectly formatted/i)).toBeVisible()
})
