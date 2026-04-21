import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function mustMatchValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const formGroup = control;
    const mainControl = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);

    if (!mainControl || !matchingControl) {
      return null;
    }

    return mainControl.value === matchingControl.value ? null : { passwordMismatch: true };
  };
}
