import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
import { GET_ME } from '../utils/queries';
import { REMOVE_BOOK } from '../utils/mutations';
import type { User } from '../models/User';

const SavedBooks = () => {
  const { loading, data } = useQuery(GET_ME);
  const [removeBook, { error }] = useMutation(REMOVE_BOOK);

  const userData: User | undefined = data?.me;

  const handleDeleteBook = async (bookId: string) => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;
    if (!token) return false;

    try {
      await removeBook({
        variables: { bookId },
        // Update the cache to reflect the book removal
        update: (cache) => {
          const dataInCache = cache.readQuery({ query: GET_ME });
          if (dataInCache) {
            cache.writeQuery({
              query: GET_ME,
              data: {
                me: {
                  ...dataInCache.me,
                  savedBooks: dataInCache.me.savedBooks.filter(
                    (book: any) => book.bookId !== bookId
                  ),
                },
              },
            });
          }
        }
      });
      removeBookId(bookId);
    } catch (err) {
      console.error(err);
      console.error("GraphQL Error", error); 
    }
  };

  if (loading) {
    return <h2>LOADING...</h2>;
  }
  
  // Handle case where userData is not yet available or no saved books
  if (!userData?.savedBooks?.length) {
    return (
      <>
        <div className='text-light bg-dark p-5'>
          <Container>
            <h1>Viewing saved books!</h1>
          </Container>
        </div>
        <Container>
          <h2 className='pt-5'>You have no saved books!</h2>
        </Container>
      </>
    );
  }

  return (
    <>
      <div className='text-light bg-dark p-5'>
        <Container>
          <h1>Viewing {userData.username}'s saved books!</h1>
        </Container>
      </div>
      <Container>
        <h2 className='pt-5'>
          {`Viewing ${userData.savedBooks.length} saved ${
            userData.savedBooks.length === 1 ? 'book' : 'books'
          }:`}
        </h2>
        <Row>
          {userData.savedBooks.map((book) => {
            return (
              <Col md='4' key={book.bookId}>
                <Card border='dark'>
                  {book.image ? (
                    <Card.Img
                      src={book.image}
                      alt={`The cover for ${book.title}`}
                      variant='top'
                    />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Authors: {book.authors?.join(', ')}</p>
                    <Card.Text>{book.description}</Card.Text>
                    <Button
                      className='btn-block btn-danger'
                      onClick={() => handleDeleteBook(book.bookId)}
                    >
                      Delete this Book!
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;
