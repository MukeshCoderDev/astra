/**
 * Accessibility testing utilities for runtime validation
 */

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  element: HTMLElement;
  message: string;
  rule: string;
  suggestion?: string;
}

/**
 * Check if an element has sufficient color contrast
 */
export function checkColorContrast(element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const computedStyle = window.getComputedStyle(element);
  const backgroundColor = computedStyle.backgroundColor;
  const color = computedStyle.color;

  // This is a simplified check - in production, use a proper color contrast library
  if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
    // Check parent background
    let parent = element.parentElement;
    while (parent && window.getComputedStyle(parent).backgroundColor === 'rgba(0, 0, 0, 0)') {
      parent = parent.parentElement;
    }
  }

  // For now, we'll just warn about potential issues
  if (color === backgroundColor) {
    issues.push({
      type: 'error',
      element,
      message: 'Text color matches background color',
      rule: 'color-contrast',
      suggestion: 'Ensure text has sufficient contrast against its background'
    });
  }

  return issues;
}

/**
 * Check if interactive elements have proper focus indicators
 */
export function checkFocusIndicators(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const interactiveElements = container.querySelectorAll(
    'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'
  );

  interactiveElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlElement, ':focus');
    
    // Check if element has focus styles
    if (!htmlElement.classList.contains('focus:ring-2') && 
        !htmlElement.classList.contains('focus:outline-none') &&
        computedStyle.outline === 'none' && 
        computedStyle.boxShadow === 'none') {
      issues.push({
        type: 'warning',
        element: htmlElement,
        message: 'Interactive element may not have visible focus indicator',
        rule: 'focus-visible',
        suggestion: 'Add focus:ring-2 or similar focus styles'
      });
    }
  });

  return issues;
}

/**
 * Check for proper heading hierarchy
 */
export function checkHeadingHierarchy(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    
    if (level > previousLevel + 1) {
      issues.push({
        type: 'warning',
        element: heading as HTMLElement,
        message: `Heading level ${level} follows level ${previousLevel}, skipping levels`,
        rule: 'heading-hierarchy',
        suggestion: 'Use heading levels in sequential order (h1, h2, h3, etc.)'
      });
    }
    
    previousLevel = level;
  });

  return issues;
}

/**
 * Check for missing alt text on images
 */
export function checkImageAltText(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const images = container.querySelectorAll('img');

  images.forEach((img) => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'error',
        element: img,
        message: 'Image missing alt attribute',
        rule: 'img-alt',
        suggestion: 'Add alt="" for decorative images or descriptive alt text for informative images'
      });
    } else if (img.alt === img.src || img.alt.includes('image') || img.alt.includes('photo')) {
      issues.push({
        type: 'warning',
        element: img,
        message: 'Image alt text may not be descriptive enough',
        rule: 'img-alt-descriptive',
        suggestion: 'Use descriptive alt text that conveys the meaning and context of the image'
      });
    }
  });

  return issues;
}

/**
 * Check for proper form labels
 */
export function checkFormLabels(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const formControls = container.querySelectorAll('input, select, textarea');

  formControls.forEach((control) => {
    const htmlControl = control as HTMLInputElement;
    const id = htmlControl.id;
    const ariaLabel = htmlControl.getAttribute('aria-label');
    const ariaLabelledBy = htmlControl.getAttribute('aria-labelledby');
    
    // Skip hidden inputs
    if (htmlControl.type === 'hidden') return;
    
    let hasLabel = false;
    
    if (id) {
      const label = container.querySelector(`label[for="${id}"]`);
      if (label) hasLabel = true;
    }
    
    if (ariaLabel || ariaLabelledBy) hasLabel = true;
    
    // Check if wrapped in label
    const parentLabel = htmlControl.closest('label');
    if (parentLabel) hasLabel = true;
    
    if (!hasLabel) {
      issues.push({
        type: 'error',
        element: htmlControl,
        message: 'Form control missing accessible label',
        rule: 'form-label',
        suggestion: 'Add a label element, aria-label, or aria-labelledby attribute'
      });
    }
  });

  return issues;
}

/**
 * Check for proper ARIA usage
 */
export function checkAriaUsage(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const elementsWithAria = container.querySelectorAll('[aria-labelledby], [aria-describedby]');

  elementsWithAria.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const labelledBy = htmlElement.getAttribute('aria-labelledby');
    const describedBy = htmlElement.getAttribute('aria-describedby');

    if (labelledBy) {
      const labelIds = labelledBy.split(' ');
      labelIds.forEach(id => {
        if (!container.querySelector(`#${id}`)) {
          issues.push({
            type: 'error',
            element: htmlElement,
            message: `aria-labelledby references non-existent element with id "${id}"`,
            rule: 'aria-labelledby-valid',
            suggestion: 'Ensure the referenced element exists and has the correct id'
          });
        }
      });
    }

    if (describedBy) {
      const descriptionIds = describedBy.split(' ');
      descriptionIds.forEach(id => {
        if (!container.querySelector(`#${id}`)) {
          issues.push({
            type: 'error',
            element: htmlElement,
            message: `aria-describedby references non-existent element with id "${id}"`,
            rule: 'aria-describedby-valid',
            suggestion: 'Ensure the referenced element exists and has the correct id'
          });
        }
      });
    }
  });

  return issues;
}

/**
 * Check for keyboard accessibility
 */
export function checkKeyboardAccessibility(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const interactiveElements = container.querySelectorAll(
    'button, a, input, select, textarea, [onclick], [role="button"], [role="link"]'
  );

  interactiveElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const tabIndex = htmlElement.tabIndex;
    const role = htmlElement.getAttribute('role');

    // Check for positive tabindex (anti-pattern)
    if (tabIndex > 0) {
      issues.push({
        type: 'warning',
        element: htmlElement,
        message: 'Positive tabindex detected, may disrupt natural tab order',
        rule: 'tabindex-positive',
        suggestion: 'Use tabindex="0" or remove tabindex to maintain natural tab order'
      });
    }

    // Check for click handlers without keyboard support
    if (htmlElement.onclick && !role && htmlElement.tagName !== 'BUTTON' && htmlElement.tagName !== 'A') {
      issues.push({
        type: 'warning',
        element: htmlElement,
        message: 'Element with click handler may not be keyboard accessible',
        rule: 'keyboard-accessible',
        suggestion: 'Use button element or add keyboard event handlers and proper ARIA roles'
      });
    }
  });

  return issues;
}

/**
 * Run all accessibility checks
 */
export function runAccessibilityAudit(container: HTMLElement = document.body): AccessibilityIssue[] {
  const allIssues: AccessibilityIssue[] = [];

  allIssues.push(...checkColorContrast(container));
  allIssues.push(...checkFocusIndicators(container));
  allIssues.push(...checkHeadingHierarchy(container));
  allIssues.push(...checkImageAltText(container));
  allIssues.push(...checkFormLabels(container));
  allIssues.push(...checkAriaUsage(container));
  allIssues.push(...checkKeyboardAccessibility(container));

  return allIssues;
}

/**
 * Log accessibility issues to console
 */
export function logAccessibilityIssues(issues: AccessibilityIssue[]): void {
  if (issues.length === 0) {
    console.log('✅ No accessibility issues found');
    return;
  }

  console.group(`🔍 Accessibility Audit Results (${issues.length} issues)`);
  
  const errors = issues.filter(issue => issue.type === 'error');
  const warnings = issues.filter(issue => issue.type === 'warning');
  const info = issues.filter(issue => issue.type === 'info');

  if (errors.length > 0) {
    console.group(`❌ Errors (${errors.length})`);
    errors.forEach(issue => {
      console.error(`${issue.rule}: ${issue.message}`, issue.element);
      if (issue.suggestion) {
        console.log(`💡 Suggestion: ${issue.suggestion}`);
      }
    });
    console.groupEnd();
  }

  if (warnings.length > 0) {
    console.group(`⚠️ Warnings (${warnings.length})`);
    warnings.forEach(issue => {
      console.warn(`${issue.rule}: ${issue.message}`, issue.element);
      if (issue.suggestion) {
        console.log(`💡 Suggestion: ${issue.suggestion}`);
      }
    });
    console.groupEnd();
  }

  if (info.length > 0) {
    console.group(`ℹ️ Info (${info.length})`);
    info.forEach(issue => {
      console.info(`${issue.rule}: ${issue.message}`, issue.element);
      if (issue.suggestion) {
        console.log(`💡 Suggestion: ${issue.suggestion}`);
      }
    });
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Development helper to run accessibility audit on page load
 */
export function enableAccessibilityAudit(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const runAudit = () => {
    const issues = runAccessibilityAudit();
    logAccessibilityIssues(issues);
  };

  // Run audit after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAudit);
  } else {
    runAudit();
  }

  // Re-run audit when DOM changes (debounced)
  let auditTimeout: NodeJS.Timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(auditTimeout);
    auditTimeout = setTimeout(runAudit, 1000);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label', 'aria-labelledby', 'aria-describedby', 'alt', 'role']
  });
}

// Auto-enable in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  enableAccessibilityAudit();
}