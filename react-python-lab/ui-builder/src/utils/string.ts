function objectToJsonString(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2); // `null, 2` để tạo JSON đẹp, có format
  } catch (error) {
    console.error("Lỗi khi chuyển object sang JSON:", error);
    return "";
  }
}

function parseJsonString<T>(jsonString: string): T | null {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    console.error("Lỗi khi parse JSON:", error);
    return null;
  }
}

const cleanString = (value: string): string => {
  if (!value) return "";

  const whitespaceRegex = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]+/g;

  const protectQuotedStrings = (input: string): string => {
    const quoteRegex = /('[^']*')|("[^"]*")/g;
    const placeholders: string[] = [];
    let placeholderIndex = 0;

    const protectedString = input.replace(quoteRegex, (match) => {
      placeholders.push(match);
      return `__PLACEHOLDER_${placeholderIndex++}__`;
    });

    const cleanedString = protectedString
      .replace(whitespaceRegex, " ")
      .trim();

    return cleanedString.replace(/__PLACEHOLDER_(\d+)__/g, (_, index) => placeholders[parseInt(index)]);
  };

  return protectQuotedStrings(value);
};

export { objectToJsonString, parseJsonString, cleanString };
