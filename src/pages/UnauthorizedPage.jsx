const UnauthorizedPage = () => {
    return (
      <div className="container text-center mt-5">
        <div className="alert alert-danger">
          <h1>⛔ Accès non autorisé</h1>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.</p>
          <Link to="/dashboard" className="btn btn-primary">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  };