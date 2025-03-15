import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Custom Validator: endDate harus setelah startDate
 */
@ValidatorConstraint({ name: 'IsEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDate implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const { startDate } = args.object as any;
    if (!startDate || !endDate) return false;
    return new Date(endDate) > new Date(startDate);
  }

  defaultMessage() {
    return `endDate must be after startDate`;
  }
}
