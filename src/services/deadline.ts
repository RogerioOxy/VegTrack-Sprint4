export async function comPrazo<T>(operation: Promise<T>, milliseconds = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Tempo de localização esgotado. Tente novamente ou use a localização demonstrativa do trecho.')), milliseconds);
    })]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}
