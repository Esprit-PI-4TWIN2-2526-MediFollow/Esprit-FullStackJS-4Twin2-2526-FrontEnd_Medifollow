import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgApexchartsModule } from 'ng-apexcharts';
import { FullCalendarModule } from '@fullcalendar/angular';

import { AppRoutingModule } from './app-routing.module';
import { AlertComponent } from './shared/components/ui/alert/alert.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AppComponent } from './app.component';
import { AppHeaderComponent } from './shared/layout/app-header/app-header.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';

import { AuthPageLayoutComponent } from './shared/layout/auth-page-layout/auth-page-layout.component';
import { AvatarComponent } from './shared/components/ui/avatar/avatar.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { AvatarTextComponent } from './shared/components/ui/avatar/avatar-text.component';
import { BackdropComponent } from './shared/layout/backdrop/backdrop.component';
import { BadgeComponent } from './shared/components/ui/badge/badge.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { BarChartOneComponent } from './shared/components/charts/bar/bar-chart-one/bar-chart-one.component';
import { BasicTableFiveComponent } from './shared/components/tables/basic-tables/basic-table-five/basic-table-five.component';
import { BasicTableFourComponent } from './shared/components/tables/basic-tables/basic-table-four/basic-table-four.component';
import { BasicTableOneComponent } from './shared/components/tables/basic-tables/basic-table-one/basic-table-one.component';
import { BasicTableThreeComponent } from './shared/components/tables/basic-tables/basic-table-three/basic-table-three.component';
import { BasicTableTwoComponent } from './shared/components/tables/basic-tables/basic-table-two/basic-table-two.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { ButtonComponent } from './shared/components/ui/button/button.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { ChartTabComponent } from './shared/components/common/chart-tab/chart-tab.component';
import { CheckboxComponent } from './shared/components/form/input/checkbox.component';
import { CheckboxComponentsComponent } from './shared/components/form/form-elements/checkbox-components/checkbox-components.component';
import { ComponentCardComponent } from './shared/components/common/component-card/component-card.component';
import { CountryMapComponent } from './shared/components/ecommerce/country-map/country-map.component';
import { DatePickerComponent } from './shared/components/form/date-picker/date-picker.component';
import { DefaultInputsComponent } from './shared/components/form/form-elements/default-inputs/default-inputs.component';
import { DemographicCardComponent } from './shared/components/ecommerce/demographic-card/demographic-card.component';
import { DropdownComponent } from './shared/components/ui/dropdown/dropdown.component';
import { DropdownItemComponent } from './shared/components/ui/dropdown/dropdown-item/dropdown-item.component';
import { DropdownItemTwoComponent } from './shared/components/ui/dropdown/dropdown-item/dropdown-item.component-two';
import { DropzoneComponent } from './shared/components/form/form-elements/dropzone/dropzone.component';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { EcommerceMetricsComponent } from './shared/components/ecommerce/ecommerce-metrics/ecommerce-metrics.component';
import { FileInputComponent } from './shared/components/form/input/file-input.component';
import { FileInputExampleComponent } from './shared/components/form/form-elements/file-input-example/file-input-example.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { FourIstoThreeComponent } from './shared/components/ui/videos/four-isto-three/four-isto-three.component';
import { GridShapeComponent } from './shared/components/common/grid-shape/grid-shape.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { InputFieldComponent } from './shared/components/form/input/input-field.component';
import { InputGroupComponent } from './shared/components/form/form-elements/input-group/input-group.component';
import { InputStatesComponent } from './shared/components/form/form-elements/input-states/input-states.component';
import { InvoiceMainComponent } from './shared/components/invoice/invoice-main/invoice-main.component';
import { InvoiceSidebarComponent } from './shared/components/invoice/invoice-sidebar/invoice-sidebar.component';
import { InvoiceTableComponent } from './shared/components/invoice/invoice-table/invoice-table.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LabelComponent } from './shared/components/form/label/label.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { LineChartOneComponent } from './shared/components/charts/line/line-chart-one/line-chart-one.component';
import { ModalComponent } from './shared/components/ui/modal/modal.component';
import { MonthlySalesChartComponent } from './shared/components/ecommerce/monthly-sales-chart/monthly-sales-chart.component';
import { MonthlyTargetComponent } from './shared/components/ecommerce/monthly-target/monthly-target.component';
import { MultiSelectComponent } from './shared/components/form/multi-select/multi-select.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { NotificationDropdownComponent } from './shared/components/header/notification-dropdown/notification-dropdown.component';
import { OneIstoOneComponent } from './shared/components/ui/videos/one-isto-one/one-isto-one.component';
import { PageBreadcrumbComponent } from './shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PhoneInputComponent } from './shared/components/form/group-input/phone-input/phone-input.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { RadioButtonsComponent } from './shared/components/form/form-elements/radio-buttons/radio-buttons.component';
import { RadioComponent } from './shared/components/form/input/radio.component';
import { RecentOrdersComponent } from './shared/components/ecommerce/recent-orders/recent-orders.component';
import { ResponsiveImageComponent } from './shared/components/ui/images/responsive-image/responsive-image.component';
import { SafeHtmlPipe } from './shared/pipe/safe-html.pipe';
import { SelectComponent } from './shared/components/form/select/select.component';
import { SelectInputsComponent } from './shared/components/form/form-elements/select-inputs/select-inputs.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { SigninFormComponent } from './shared/components/auth/signin-form/signin-form.component';
import { SignupFormComponent } from './shared/components/auth/signup-form/signup-form.component';
import { SixteenIstoNineComponent } from './shared/components/ui/videos/sixteen-isto-nine/sixteen-isto-nine.component';
import { StatisticsChartComponent } from './shared/components/ecommerce/statics-chart/statics-chart.component';
import { SwitchComponent } from './shared/components/form/input/switch.component';
import { TableDropdownComponent } from './shared/components/common/table-dropdown/table-dropdown.component';
import { TextAreaComponent } from './shared/components/form/input/text-area.component';
import { TextAreaInputComponent } from './shared/components/form/form-elements/text-area-input/text-area-input.component';
import { ThemeToggleButtonComponent } from './shared/components/common/theme-toggle/theme-toggle-button.component';
import { ThemeToggleTwoComponent } from './shared/components/common/theme-toggle-two/theme-toggle-two.component';
import { ThreeColumnImageGridComponent } from './shared/components/ui/images/three-column-image-grid/three-column-image-grid.component';
import { TimePickerComponent } from './shared/components/form/time-picker/time-picker.component';
import { ToggleSwitchComponent } from './shared/components/form/form-elements/toggle-switch/toggle-switch.component';
import { TwentyoneIstoNineComponent } from './shared/components/ui/videos/twentyone-isto-nine/twentyone-isto-nine.component';
import { TwoColumnImageGridComponent } from './shared/components/ui/images/two-column-image-grid/two-column-image-grid.component';
import { UserAddressCardComponent } from './shared/components/user-profile/user-address-card/user-address-card.component';
import { UserDropdownComponent } from './shared/components/header/user-dropdown/user-dropdown.component';
import { UserInfoCardComponent } from './shared/components/user-profile/user-info-card/user-info-card.component';
import { UserMetaCardComponent } from './shared/components/user-profile/user-meta-card/user-meta-card.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { AppSidebarComponent } from './shared/layout/app-sidebar/app-sidebar.component';
import { SidebarWidgetComponent } from './shared/layout/app-sidebar/app-sidebar-widget.component';

import { ForgotPasswordComponent } from './shared/components/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './shared/components/auth/reset-password/reset-password.component';

import { provideHttpClient } from '@angular/common/http';

@NgModule({
  declarations: [
    AlertComponent,
    AlertsComponent,
    AppComponent,
    AppHeaderComponent,
    AppLayoutComponent,
    AppSidebarComponent,
    SidebarWidgetComponent,
    AuthPageLayoutComponent,
    AvatarComponent,
    AvatarElementComponent,
    AvatarTextComponent,
    BackdropComponent,
    BadgeComponent,
    BadgesComponent,
    BarChartComponent,
    BarChartOneComponent,
    BasicTableFiveComponent,
    BasicTableFourComponent,
    BasicTableOneComponent,
    BasicTableThreeComponent,
    BasicTableTwoComponent,
    BasicTablesComponent,
    BlankComponent,
    ButtonComponent,
    ButtonsComponent,
    CalenderComponent,
    ChartTabComponent,
    CheckboxComponent,
    CheckboxComponentsComponent,
    ComponentCardComponent,
    CountryMapComponent,
    DatePickerComponent,
    DefaultInputsComponent,
    DemographicCardComponent,
    DropdownComponent,
    DropdownItemComponent,
    DropdownItemTwoComponent,
    DropzoneComponent,
    EcommerceComponent,
    EcommerceMetricsComponent,
    FileInputComponent,
    FileInputExampleComponent,
    FormElementsComponent,
    FourIstoThreeComponent,
    GridShapeComponent,
    ImagesComponent,
    InputFieldComponent,
    InputGroupComponent,
    InputStatesComponent,
    InvoiceMainComponent,
    InvoiceSidebarComponent,
    InvoiceTableComponent,
    InvoicesComponent,
    LabelComponent,
    LineChartComponent,
    LineChartOneComponent,
    ModalComponent,
    MonthlySalesChartComponent,
    MonthlyTargetComponent,
    MultiSelectComponent,
    NotFoundComponent,
    NotificationDropdownComponent,
    OneIstoOneComponent,
    PageBreadcrumbComponent,
    PhoneInputComponent,
    ProfileComponent,
    RadioButtonsComponent,
    RadioComponent,
    RecentOrdersComponent,
    ResponsiveImageComponent,
    SafeHtmlPipe,
    SelectComponent,
    SelectInputsComponent,
    SignInComponent,
    SignUpComponent,
    SigninFormComponent,
    SignupFormComponent,
    SixteenIstoNineComponent,
    StatisticsChartComponent,
    SwitchComponent,
    TableDropdownComponent,
    TextAreaComponent,
    TextAreaInputComponent,
    ThemeToggleButtonComponent,
    ThemeToggleTwoComponent,
    ThreeColumnImageGridComponent,
    TimePickerComponent,
    ToggleSwitchComponent,
    TwentyoneIstoNineComponent,
    TwoColumnImageGridComponent,
    UserAddressCardComponent,
    UserDropdownComponent,
    UserInfoCardComponent,
    UserMetaCardComponent,
    VideosComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgApexchartsModule,
    FullCalendarModule,
  ],
  providers: [
provideHttpClient()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
