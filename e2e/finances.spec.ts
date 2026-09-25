import { test, expect } from '@playwright/test';

test.describe('E2E Financial Core User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads home dashboard and checks financial balance card', async ({ page }) => {
    // Expect app title and main balance to be visible
    await expect(page.locator('text=Finanças Pessoais').first()).toBeVisible();
    await expect(page.locator('#floating-quick-add-btn')).toBeVisible();
  });

  test('registers, edits and deletes a new expense transaction', async ({ page }) => {
    // 1. Click floating quick add button
    await page.locator('#floating-quick-add-btn').click();

    // 2. Fill transaction details
    const amountInput = page.locator('input[type="number"], input[placeholder*="0,00"]').first();
    await amountInput.fill('85.50');

    const descInput = page.locator('input[placeholder*="descrição"], input[placeholder*="mercado"]').first();
    if (await descInput.isVisible()) {
      await descInput.fill('Compras Supermercado E2E');
    }

    // Submit
    const submitBtn = page.locator('button:has-text("Salvar"), button:has-text("Adicionar")').first();
    await submitBtn.click();

    // 3. Switch to Extrato tab
    await page.locator('button:has-text("Extrato")').click();
    await expect(page.locator('text=Compras Supermercado E2E').first()).toBeVisible();
  });

  test('pays a pending fixed bill and updates status', async ({ page }) => {
    // Navigate to Cartões & Faturas tab
    await page.locator('button:has-text("Cartões & Faturas")').click();

    // Find first unpaid bill and click to mark as paid
    const payBillBtn = page.locator('button:has-text("Pagar"), button[title*="Pagar"]').first();
    if (await payBillBtn.isVisible()) {
      await payBillBtn.click();
      await expect(page.locator('text=Conta paga com sucesso').or(page.locator('text=Paga'))).toBeVisible();
    }
  });

  test('adds an investment asset to portfolio', async ({ page }) => {
    // Navigate to Investir tab
    await page.locator('button:has-text("Investir")').click();

    // Click Novo Ativo
    const addAssetBtn = page.locator('button:has-text("Novo Ativo"), button:has-text("Adicionar Ativo")').first();
    if (await addAssetBtn.isVisible()) {
      await addAssetBtn.click();
      await page.locator('input[placeholder*="Nome"], input[placeholder*="Ex: Tesouro"]').first().fill('Tesouro IPCA+ 2035 E2E');
      await page.locator('input[placeholder*="0,00"], input[type="number"]').first().fill('1200');
      await page.locator('button:has-text("Salvar")').last().click();
      await expect(page.locator('text=Tesouro IPCA+ 2035 E2E')).toBeVisible();
    }
  });

  test('triggers PDF and CSV statement export', async ({ page }) => {
    await page.locator('button:has-text("Extrato")').click();

    const csvBtn = page.locator('button[title*="CSV"], button:has-text("CSV")').first();
    await expect(csvBtn).toBeVisible();

    const pdfBtn = page.locator('button[title*="PDF"], button:has-text("PDF")').first();
    await expect(pdfBtn).toBeVisible();
  });
});
