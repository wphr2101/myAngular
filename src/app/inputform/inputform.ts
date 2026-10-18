import { HttpClient, HttpHeaders } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { Component, inject } from '@angular/core';
import { apiConfig, apiRequestOptions } from '../api.config';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

type FormMode = 'reactive' | 'template';

interface VisitorCommentForm {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  phone: string;
  comments: string;
}

@Component({
  selector: 'app-inputform',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inputform.html',
  styleUrl: './inputform.css',
})
export class Inputform {
  private readonly http = inject(HttpClient);
  private readonly insertCommentUrl = apiConfig.baseUrl + '/api/insertComment';

  protected formMode: FormMode = 'reactive';
  protected submitted = false;
  protected isSubmitting = false;
  protected templateModel: VisitorCommentForm = this.createEmptyForm();

  protected readonly inputForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    address: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    city: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    state: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    zipcode: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    comments: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
  });

  protected get name() {
    return this.formMode === 'reactive'
      ? this.inputForm.controls.name.value
      : this.templateModel.name;
  }

  protected get currentCodeSample() {
    return this.formMode === 'reactive'
      ? this.reactiveFormCodeSample
      : this.templateDrivenFormCodeSample;
  }

  protected setFormMode(mode: FormMode) {
    this.formMode = mode;
    this.submitted = false;
  }

  protected showFormValues() {
    this.submitted = true;

    if (this.inputForm.invalid) {
      this.inputForm.markAllAsTouched();
      return;
    }

    const values = this.inputForm.getRawValue();
    this.submitComment(values, () => this.inputForm.reset());
  }

  protected submitTemplateForm(form: NgForm) {
    this.submitted = true;

    if (form.invalid) {
      return;
    }

    this.submitComment(this.templateModel, () => {
      this.templateModel = this.createEmptyForm();
      form.resetForm(this.templateModel);
    });
  }

  private submitComment(values: VisitorCommentForm, resetForm: () => void) {
    const comment = {
      name: values.name,
      email: values.email,
      address: values.address,
      city: values.city,
      state: values.state,
      zipcode: values.zipcode,
      phoneNumber: values.phone,
      comments: values.comments,
    };

    this.isSubmitting = true;

    this.http
      .get<{ requestToken: string }>(apiConfig.baseUrl + '/api/auth/csrf', {
        ...apiRequestOptions, withCredentials: true,
      })
      .pipe(switchMap(csrf => this.http.post<{ message: string }>(this.insertCommentUrl, comment, {
        ...apiRequestOptions, withCredentials: true,
        headers: new HttpHeaders(apiRequestOptions.headers).set('X-CSRF-TOKEN', csrf.requestToken),
      })))
      .subscribe({
        next: (response) => {
          window.alert(response.message);
          resetForm();
          this.submitted = false;
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Unable to submit visitor comment.', error);
          window.alert('Unable to submit your comment. Please try again.');
          this.isSubmitting = false;
        },
      });
  }

  private createEmptyForm(): VisitorCommentForm {
    return {
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zipcode: '',
      phone: '',
      comments: '',
    };
  }

  private readonly reactiveFormCodeSample = `// Reactive Forms
inputForm = new FormGroup({
  name: new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  }),
  email: new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  }),
});

submitReactiveForm() {
  if (this.inputForm.invalid) {
    this.inputForm.markAllAsTouched();
    return;
  }

  const values = this.inputForm.getRawValue();
  this.submitComment(values);
}`;

  private readonly templateDrivenFormCodeSample = `<!-- Template-driven Forms -->
<form #templateForm="ngForm"
      (ngSubmit)="submitTemplateForm(templateForm)">
  <input
    name="name"
    [(ngModel)]="templateModel.name"
    required
  />

  <button type="submit">
    Submit
  </button>
</form>

submitTemplateForm(form: NgForm) {
  if (form.invalid) {
    return;
  }

  this.submitComment(this.templateModel);
}`;

  protected readonly states = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'YT', label: 'Yukon' },
  ];
}
