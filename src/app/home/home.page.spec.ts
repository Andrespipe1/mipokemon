import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})



export class HomePage implements OnInit {
  pokemons: any[] = [];
  filteredPokemons: any[] = [];
  offset = 0;
  limit = 20;
  loading = false;
  searchTerm: string = '';
  isSearchingAPI: boolean = false;
  private searchTerms = new Subject<string>();

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadPokemons();
    
    this.searchTerms.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(term => {
        this.searchTerm = term; // Mantener sincronizado
        if (!term || term.length < 1) {
          this.isSearchingAPI = false;
          return of(this.pokemons); // Mostrar todos cuando se borra la búsqueda
        }
        
        if (term.length > 2) {
          this.isSearchingAPI = true;
          return this.http.get<any>(`https://pokeapi.co/api/v2/pokemon/${term.toLowerCase()}`).pipe(
            switchMap(pokeDetails => {
              const pokemonData = {
                name: pokeDetails.name,
                image: pokeDetails.sprites.front_default || 'assets/pokeball.png', // Imagen por defecto
                stats: pokeDetails.stats.map((stat: any) => ({
                  name: stat.stat.name,
                  value: stat.base_stat
                }))
              };
              this.isSearchingAPI = false;
              return of([pokemonData]);
            }),
            catchError((error: HttpErrorResponse) => {
              this.isSearchingAPI = false;
              if (error.status === 404) {
                // Si no se encuentra en la API, buscar en los pokémons ya cargados
                return of(this.pokemons.filter(p => 
                  p.name.toLowerCase().includes(term.toLowerCase())
                ));
              }
              return of([]); // Retornar array vacío en caso de otros errores
            })
          );
        } else {
          this.isSearchingAPI = false;
          // Búsqueda local en los pokémons ya cargados
          return of(this.pokemons.filter(p => 
            p.name.toLowerCase().includes(term.toLowerCase())
          ));
        }
      })
    ).subscribe({
      next: results => {
        this.filteredPokemons = results;
      },
      error: err => {
        this.isSearchingAPI = false;
        this.filteredPokemons = [];
      }
    });
  }

  search(event: Event): void {
    const term = (event as CustomEvent).detail.value || '';
    this.searchTerms.next(term);
  }

  
  loadPokemons(event?: any) {
    if (this.loading || this.isSearchingAPI) {
      if (event) event.target.complete();
      return;
    }

    this.loading = true;
    this.http
      .get<any>(`https://pokeapi.co/api/v2/pokemon?offset=${this.offset}&limit=${this.limit}`)
      .subscribe({
        next: (res) => {
          const results = res.results;
          const requests = results.map((pokemon: any) => 
            this.http.get(pokemon.url)
          );

          // Usamos Promise.all para manejar todas las solicitudes
          Promise.all(requests.map((req: Observable<any>) => req.toPromise()))
            .then((pokeDetailsArray: any[]) => {
              pokeDetailsArray.forEach((pokeDetails: any) => {
                const pokemonData = {
                  name: pokeDetails.name,
                  image: pokeDetails.sprites.front_default || 'assets/pokeball.png',
                  stats: pokeDetails.stats.map((stat: any) => ({
                    name: stat.stat.name,
                    value: stat.base_stat
                  }))
                };

                this.pokemons.push(pokemonData);
              });

              // Actualizar la lista filtrada solo si no hay búsqueda activa
              if (!this.searchTerm) {
                this.filteredPokemons = [...this.pokemons];
              } else {
                // Si hay búsqueda activa, volver a filtrar
                this.searchTerms.next(this.searchTerm);
              }

              this.offset += this.limit;
              this.loading = false;

              if (event) {
                event.target.complete();
              }

              if (res.next === null && event) {
                event.target.disabled = true;
              }
            });
        },
        error: (err) => {
          this.loading = false;
          if (event) event.target.complete();
          console.error('Error loading pokemons:', err);
        }
      });
  }

  goToDetail(pokemonName: string) {
    this.router.navigate(['/pokemon-detail', pokemonName]);
  }
}