import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
//import { SelectOptionsComponent } from './pages/select-options/select-options.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  //{ path: 'select-options', component: SelectOptionsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {}
